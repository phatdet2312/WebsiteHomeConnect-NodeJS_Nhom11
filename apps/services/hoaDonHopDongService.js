const repo = require('../repositories/hoaDonRepository');
const vnpayService = require('./vnpayService');
const { Op } = require('sequelize');
const { LoaiTTHD, CT_ThanhToan, HD_HopDong, CT_HDHD, LS_TTHDHD, TrangThai, PTTT, CanHo, Tang, ToaNha, KyTT, sequelize } = require('../models');

class HoaDonHopDongService {
    async getDanhSachHDNo(maKH) {
        const hopDongs = await repo.getActiveHopDongs(maKH);
        if (!hopDongs.length) return [];
        const maCanHoList = hopDongs.map(h => h.MaCanHo);

        const loais = await LoaiTTHD.findAll({ where: { TTHienThi: true } });
        const maTTPaid = await repo.layMaTrangThai('Đã thanh toán');
        const lockedIds = await repo.getHoaDonBiKhoaHD(maTTPaid, null);
        const ctList = await CT_ThanhToan.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });

        const nDict = {};
        for (const ct of ctList) {
            const paid = await repo.getTongDaThanhToanHD(ct.MaLoaiTT, ct.MaCanHo, ct.MaKyTT, lockedIds);
            if (ct.Gia - paid > 0) nDict[ct.MaLoaiTT] = (nDict[ct.MaLoaiTT] || 0) + 1;
        }
        return loais.map(l => ({ maLoaiTT: l.MaLoaiTT, tenLoaiTT: l.TenLoaiTT, urlIcon: l.UrlIcon, soKyNo: nDict[l.MaLoaiTT] || 0 }));
    }

    async getUnpaidItems(maKH, maLoaiTT) {
        const hopDongs = await repo.getActiveHopDongs(maKH);
        const maCanHoList = hopDongs.map(h => h.MaCanHo);
        if (!maCanHoList.length) throw new Error('Bạn không có hợp đồng đang hoạt động!');

        const maTTPaid = await repo.layMaTrangThai('Đã thanh toán');
        const lockedIds = await repo.getHoaDonBiKhoaHD(maTTPaid, null);

        const ctList = await CT_ThanhToan.findAll({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHoList } });
        const maKys = [...new Set(ctList.map(c => c.MaKyTT))];

        const [canHos, kyTTs, loaiTT] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: maCanHoList }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            KyTT.findAll({ where: { MaKyTT: maKys } }), LoaiTTHD.findByPk(maLoaiTT)
        ]);

        const dCH = {}; canHos.forEach(c => dCH[c.MaCanHo] = c);
        const dKy = {}; kyTTs.forEach(k => dKy[k.MaKyTT] = k);

        const unpaidItems = [];
        for (const ct of ctList) {
            if (!ct.Gia || ct.Gia <= 0) continue;
            const paid = await repo.getTongDaThanhToanHD(ct.MaLoaiTT, ct.MaCanHo, ct.MaKyTT, lockedIds);
            const conThieu = parseInt(ct.Gia) - paid;
            if (conThieu > 0) {
                unpaidItems.push({
                    maLoaiTT: ct.MaLoaiTT, maCanHo: ct.MaCanHo, maKyTT: ct.MaKyTT,
                    tenLoaiTT: loaiTT?.TenLoaiTT || '', tenCanHo: dCH[ct.MaCanHo]?.TenCanHo || '',
                    toaNhaTang: dCH[ct.MaCanHo] ? `Tòa ${dCH[ct.MaCanHo].Tang?.ToaNha?.TenToaNha || ''} - Tầng ${dCH[ct.MaCanHo].Tang?.TenTang || ''}` : '',
                    tenKy: dKy[ct.MaKyTT]?.TenKyTT || '', ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toLocaleDateString('vi-VN') : 'Không có hạn',
                    conThieu: conThieu
                });
            }
        }
        const pttts = await repo.getAllPTTT();
        return { unpaidItems, pttts };
    }

    async getHistory(maKH) {
        const hopDongs = await repo.getAllHopDongsByKhach(maKH);
        const maHDs = hopDongs.map(h => h.MaHopDong);
        if (!maHDs.length) return [];

        const hoaDons = await HD_HopDong.findAll({
            where: { MaHopDong: maHDs },
            include: [
                { model: LS_TTHDHD, as: 'LS_TTHDHDs', include: [{ model: TrangThai, as: 'TrangThai' }] },
                { model: PTTT, as: 'PTTT' }
            ],
            order: [['NgayThanhToan', 'DESC']]
        });
        if (!hoaDons.length) return [];

        const ctHoaDons = await CT_HDHD.findAll({ where: { MaHDHD: hoaDons.map(h => h.MaHDHD) } });
        const [canHos, loais, kys] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: [...new Set(ctHoaDons.map(c => c.MaCanHo))] }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            LoaiTTHD.findAll({ where: { MaLoaiTT: [...new Set(ctHoaDons.map(c => c.MaLoaiTT))] } }),
            KyTT.findAll({ where: { MaKyTT: [...new Set(ctHoaDons.map(c => c.MaKyTT))] } })
        ]);

        const dCH = {}; canHos.forEach(c => dCH[c.MaCanHo] = c);
        const dLoai = {}; loais.forEach(l => dLoai[l.MaLoaiTT] = l);
        const dKy = {}; kys.forEach(k => dKy[k.MaKyTT] = k);

        return hoaDons.map(hd => {
            const lichSuSorted = (hd.LS_TTHDHDs || []).sort((a, b) => new Date(b.ThoiGianThayDoi) - new Date(a.ThoiGianThayDoi));
            const lastStatus = lichSuSorted.length > 0 && lichSuSorted[0].TrangThai ? lichSuSorted[0].TrangThai.TenTT : 'Chờ xử lý';
            const cts = ctHoaDons.filter(c => c.MaHDHD === hd.MaHDHD);
            const total = cts.reduce((sum, ct) => sum + (Number(ct.DonGia) * (ct.SL || 1)), 0);

            let viTri = 'Chưa xác định';
            if (cts.length > 0 && dCH[cts[0].MaCanHo]) viTri = `${dCH[cts[0].MaCanHo].TenCanHo} (Tòa ${dCH[cts[0].MaCanHo].Tang?.ToaNha?.TenToaNha || 'N/A'})`;

            return {
                maHDHD: hd.MaHDHD, ngayThanhToan: hd.NgayThanhToan, tongTien: total,
                phuongThuc: hd.PTTT?.TenPT || 'Chưa xác định', trangThaiHienTai: lastStatus, viTriDaiDien: viTri,
                chiTiet: cts.map(ct => ({
                    tenLoaiTT: dLoai[ct.MaLoaiTT]?.TenLoaiTT || `Loại #${ct.MaLoaiTT}`, tenKy: dKy[ct.MaKyTT]?.TenKyTT || `Kỳ #${ct.MaKyTT}`,
                    tenCanHo: dCH[ct.MaCanHo]?.TenCanHo || `CH #${ct.MaCanHo}`, viTri: dCH[ct.MaCanHo] ? `Tòa ${dCH[ct.MaCanHo].Tang?.ToaNha?.TenToaNha || 'N/A'} - Tầng ${dCH[ct.MaCanHo].Tang?.TenTang || 'N/A'}` : 'N/A',
                    donGia: Number(ct.DonGia), sl: ct.SL || 1
                })),
                lichSu: lichSuSorted.map(ls => ({ trangThai: ls.TrangThai?.TenTT || 'N/A', thoiGian: ls.ThoiGianThayDoi, ghiChu: ls.GhiChu || '' }))
            };
        });
    }

    async processCheckout(req, maKH, dto) {
        const pttt = await PTTT.findByPk(dto.maPT);
        if (!pttt) throw new Error('Phương thức thanh toán không hợp lệ');

        const isVnPay = pttt.TenPT.toLowerCase().includes('vnpay');
        const targetStatus = isVnPay ? 'Đang thanh toán' : 'Chờ thanh toán';

        const maTTPaid = await repo.layMaTrangThai('Đã thanh toán');
        const maTTInProg = await repo.layMaTrangThai('Đang thanh toán');
        if (!maTTPaid || !maTTInProg) throw new Error('Lỗi hệ thống: Không tìm thấy mã trạng thái');

        const lockedIds = await repo.getHoaDonBiKhoaHD(maTTPaid, maTTInProg);
        const validItems = [];
        let tongTien = 0;

        for (const i of dto.items) {
            const mL = parseInt(i.maLoaiTT), mCH = parseInt(i.maCanHo), mKy = parseInt(i.maKyTT);
            const ct = await CT_ThanhToan.findOne({ where: { MaLoaiTT: mL, MaCanHo: mCH, MaKyTT: mKy } });
            if (!ct || !ct.Gia || ct.Gia <= 0) continue;

            const paid = await repo.getTongDaThanhToanHD(mL, mCH, mKy, lockedIds);
            const conThieu = parseInt(ct.Gia) - paid;
            if (conThieu > 0) { validItems.push({ mL, mCH, mKy, conThieu }); tongTien += conThieu; }
        }

        if (!validItems.length) throw new Error('Giao dịch thất bại! Khoản này đang được thanh toán qua VNPay hoặc đã thanh toán xong.');

        const hdCurrent = await repo.getCurrentHopDong(maKH);
        const hoaDon = await HD_HopDong.create({ MaHopDong: hdCurrent?.MaHopDong, MaPT: dto.maPT, NgayThanhToan: new Date() });
        await CT_HDHD.bulkCreate(validItems.map(vi => ({ MaLoaiTT: vi.mL, MaCanHo: vi.mCH, MaKyTT: vi.mKy, MaHDHD: hoaDon.MaHDHD, SL: 1, DonGia: vi.conThieu })));
        
        const maTTFinal = await repo.layMaTrangThai(targetStatus);
        await LS_TTHDHD.create({ MaHDHD: hoaDon.MaHDHD, MaTT: maTTFinal, ThoiGianThayDoi: new Date(), GhiChu: `Khởi tạo thanh toán qua ${pttt.TenPT}` });

        if (isVnPay) {
            const url = vnpayService.createPaymentUrl(req, { amount: tongTien, orderInfo: `Thanh toan HD HomeConnect - HD#${hoaDon.MaHDHD}`, txnRef: String(hoaDon.MaHDHD), returnUrl: process.env.BASE_URL + '/hoa-don-hop-dong/vnpay-return' });
            return { isVnPay: true, redirectUrl: url, maHDHD: hoaDon.MaHDHD };
        }
        return { isVnPay: false, message: 'Đã gửi yêu cầu thanh toán. Vui lòng chờ Admin xác nhận!' };
    }

    async processHeartbeat(maHoaDon) {
        const maTTInProg = await repo.layMaTrangThai('Đang thanh toán');
        const ls = await LS_TTHDHD.findOne({ where: { MaHDHD: maHoaDon, MaTT: maTTInProg }, order: [['MaLS', 'DESC']] });
        if (ls) {
            await sequelize.query('UPDATE LS_TTHDHD SET ThoiGianThayDoi = GETDATE(), GhiChu = :g WHERE MaLS = :m', { replacements: { g: 'Heartbeat – đang ở VNPay', m: ls.MaLS } });
        }
    }

    async processVnpayReturn(query) {
        const result = vnpayService.verifyCallback(query);
        if (result.isValid && result.responseCode === '00') {
            const maHoaDon = parseInt(result.txnRef);
            const maTT = await repo.layMaTrangThai('Đã thanh toán');
            if (maHoaDon && maTT) {
                await LS_TTHDHD.create({ MaHDHD: maHoaDon, MaTT: maTT, ThoiGianThayDoi: new Date(), GhiChu: `Thanh toán thành công VNPay - Mã GD: ${result.transactionNo || ''}` });
            }
            return { success: true, result };
        }
        return { success: false, result };
    }
}
module.exports = new HoaDonHopDongService();