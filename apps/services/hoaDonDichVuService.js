// services/hoaDonDichVuService.js
const repo = require('../repositories/hoaDonRepository');
const vnpayService = require('./vnpayService');
const emailService = require('./emailService'); // Import email
const { KhachHang } = require('../models');
const { Op } = require('sequelize');
const { DichVu, CT_DichVu, HD_DichVu, CT_HDDV, LS_TTHDDV, TrangThai, PTTT, CanHo, Tang, ToaNha, Ky, sequelize } = require('../models');

class HoaDonDichVuService {
    async getDanhSachDVNo(maKH) {
        const hopDongs = await repo.getActiveHopDongs(maKH);
        if (!hopDongs.length) return [];
        const maCanHoList = hopDongs.map(h => h.MaCanHo);

        const dichVus = await DichVu.findAll({ where: { TTHienThi: true } });
        const maTTPaid = await repo.layMaTrangThai('Đã thanh toán');
        const lockedIds = await repo.getHoaDonBiKhoaDV(maTTPaid, null);
        const ctDichVus = await CT_DichVu.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });

        const nDict = {};
        for (const ct of ctDichVus) {
            const paid = await repo.getTongDaThanhToanDV(ct.MaDV, ct.MaCanHo, ct.MaKy, lockedIds);
            if (ct.Gia - paid > 0) nDict[ct.MaDV] = (nDict[ct.MaDV] || 0) + 1;
        }

        return dichVus.map(dv => ({ maDV: dv.MaDV, tenDV: dv.TenDV, urlIcon: dv.UrlIcon, soKyNo: nDict[dv.MaDV] || 0 }));
    }

    async getUnpaidItems(maKH, maDV) {
        const hopDongs = await repo.getActiveHopDongs(maKH);
        const maCanHoList = hopDongs.map(h => h.MaCanHo);
        if (!maCanHoList.length) throw new Error('Bạn không có hợp đồng căn hộ đang hoạt động!');

        const maTTPaid = await repo.layMaTrangThai('Đã thanh toán');
        const lockedIds = await repo.getHoaDonBiKhoaDV(maTTPaid, null);

        const ctList = await CT_DichVu.findAll({
            where: { MaDV: maDV, MaCanHo: maCanHoList },
            include: [
                { model: DichVu, as: 'DichVu' },
                { model: CanHo, as: 'CanHo', include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] },
                { model: Ky, as: 'Ky' }
            ]
        });

        const unpaidItems = [];
        for (const ct of ctList) {
            if (!ct.Gia || ct.Gia <= 0) continue;
            const paid = await repo.getTongDaThanhToanDV(ct.MaDV, ct.MaCanHo, ct.MaKy, lockedIds);
            const conThieu = parseInt(ct.Gia) - paid;
            if (conThieu > 0) {
                unpaidItems.push({
                    maDV: ct.MaDV, maCanHo: ct.MaCanHo, maKy: ct.MaKy,
                    tenDV: ct.DichVu?.TenDV || '', tenCanHo: ct.CanHo?.TenCanHo || '',
                    toaNhaTang: `${ct.CanHo?.Tang?.ToaNha?.TenToaNha || ''} - Tầng ${ct.CanHo?.Tang?.TenTang || ''}`,
                    tenKy: ct.Ky?.TenKy || '', ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toLocaleDateString('vi-VN') : 'Không có hạn',
                    conThieu: conThieu, urlAnh: ct.urlAnh || ''
                });
            }
        }
        const pttts = await repo.getAllPTTT();
        return { unpaidItems, pttts };
    }

    async getHistory(maKH) {
        const hoaDons = await HD_DichVu.findAll({
            where: { MaKH: maKH },
            include: [
                { model: LS_TTHDDV, as: 'LS_TTHDDVs', include: [{ model: TrangThai, as: 'TrangThai' }] },
                { model: PTTT, as: 'PTTT' }
            ],
            order: [['NgayThanhToan', 'DESC']]
        });

        if (!hoaDons.length) return [];
        const maHDList = hoaDons.map(h => h.MaHDDV);
        const ctHoaDons = await CT_HDDV.findAll({ where: { MaHDDV: maHDList } });

        const maCHs = [...new Set(ctHoaDons.map(c => c.MaCanHo))];
        const maDVs = [...new Set(ctHoaDons.map(c => c.MaDV))];
        const maKys = [...new Set(ctHoaDons.map(c => c.MaKy))];

        const ctDichVus = await CT_DichVu.findAll({ where: { [Op.or]: ctHoaDons.map(c => ({ MaDV: c.MaDV, MaCanHo: c.MaCanHo, MaKy: c.MaKy })) } });
        const dictCT = {}; ctDichVus.forEach(ct => dictCT[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] = ct);

        const [canHos, dichVus, kys] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: maCHs }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            DichVu.findAll({ where: { MaDV: maDVs } }), Ky.findAll({ where: { MaKy: maKys } })
        ]);

        const dCH = {}; canHos.forEach(c => dCH[c.MaCanHo] = c);
        const dDV = {}; dichVus.forEach(d => dDV[d.MaDV] = d);
        const dKy = {}; kys.forEach(k => dKy[k.MaKy] = k);

        return hoaDons.map(hd => {
            const lichSuSorted = (hd.LS_TTHDDVs || []).sort((a, b) => new Date(b.ThoiGianThayDoi) - new Date(a.ThoiGianThayDoi));
            const lastStatus = lichSuSorted.length > 0 && lichSuSorted[0].TrangThai ? lichSuSorted[0].TrangThai.TenTT : 'Chờ xử lý';
            const cts = ctHoaDons.filter(c => c.MaHDDV === hd.MaHDDV);
            const total = cts.reduce((sum, ct) => sum + (Number(ct.DonGia) * (ct.SL || 1)), 0);

            let viTri = 'Chưa xác định';
            if (cts.length > 0 && dCH[cts[0].MaCanHo]) viTri = `${dCH[cts[0].MaCanHo].TenCanHo} (Tòa ${dCH[cts[0].MaCanHo].Tang?.ToaNha?.TenToaNha || 'N/A'})`;

            return {
                maHDDV: hd.MaHDDV, ngayThanhToan: hd.NgayThanhToan, tongTien: total,
                phuongThuc: hd.PTTT?.TenPT || 'Chưa xác định', trangThaiHienTai: lastStatus, viTriDaiDien: viTri,
                chiTiet: cts.map(ct => ({
                    tenDV: dDV[ct.MaDV]?.TenDV || `Dịch vụ #${ct.MaDV}`, tenKy: dKy[ct.MaKy]?.TenKy || `Kỳ #${ct.MaKy}`,
                    tenCanHo: dCH[ct.MaCanHo]?.TenCanHo || `CH #${ct.MaCanHo}`, viTri: dCH[ct.MaCanHo] ? `Tòa ${dCH[ct.MaCanHo].Tang?.ToaNha?.TenToaNha || 'N/A'} - Tầng ${dCH[ct.MaCanHo].Tang?.TenTang || 'N/A'}` : 'N/A',
                    donGia: Number(ct.DonGia), sl: ct.SL || 1, urlAnh: dictCT[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`]?.urlAnh || ''
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

        const lockedIds = await repo.getHoaDonBiKhoaDV(maTTPaid, maTTInProg);
        const validItems = [];
        let tongTien = 0;

        for (const i of dto.items) {
            const mDV = parseInt(i.maDV), mCH = parseInt(i.maCanHo), mKy = parseInt(i.maKy);
            const ct = await CT_DichVu.findOne({ where: { MaDV: mDV, MaCanHo: mCH, MaKy: mKy } });
            if (!ct || !ct.Gia || ct.Gia <= 0) continue;

            const paid = await repo.getTongDaThanhToanDV(mDV, mCH, mKy, lockedIds);
            const conThieu = parseInt(ct.Gia) - paid;
            if (conThieu > 0) { validItems.push({ mDV, mCH, mKy, conThieu }); tongTien += conThieu; }
        }

        if (!validItems.length) throw new Error('Giao dịch thất bại! Kỳ dịch vụ này đang được thanh toán qua VNPay hoặc đã thanh toán xong.');

        const hoaDon = await HD_DichVu.create({ MaKH: maKH, MaPT: dto.maPT, NgayThanhToan: new Date() });
        await CT_HDDV.bulkCreate(validItems.map(vi => ({ MaDV: vi.mDV, MaCanHo: vi.mCH, MaKy: vi.mKy, MaHDDV: hoaDon.MaHDDV, SL: 1, DonGia: vi.conThieu })));

        const maTTFinal = await repo.layMaTrangThai(targetStatus);
        await LS_TTHDDV.create({ MaHDDV: hoaDon.MaHDDV, MaTT: maTTFinal, ThoiGianThayDoi: new Date(), GhiChu: `Khởi tạo thanh toán qua ${pttt.TenPT}` });

        if (isVnPay) {
            const url = vnpayService.createPaymentUrl(req, { amount: tongTien, orderInfo: `Thanh toan dich vu HomeConnect - HD#${hoaDon.MaHDDV}`, txnRef: String(hoaDon.MaHDDV), returnUrl: process.env.BASE_URL + '/hoa-don-dich-vu/vnpay-return' });
            return { isVnPay: true, redirectUrl: url, maHDDV: hoaDon.MaHDDV };
        }

        try {
            const kh = await KhachHang.findByPk(maKH);
            if (kh && kh.EmailKH) {
                // Đối với COD, trạng thái là "Chờ thanh toán", ta có thể gửi email dạng "Biên nhận yêu cầu"
                emailService.sendPaymentReceipt(
                    kh.EmailKH, 
                    kh.TenKH, 
                    hoaDon.MaHDDV, 
                    'Dịch vụ hệ thống (Chờ Admin xác nhận)', 
                    tongTien, 
                    pttt.TenPT // Sẽ hiển thị tên phương thức, ví dụ: "Tiền mặt (COD)"
                );
            }
        } catch (e) {
            console.error("Lỗi gửi mail COD/Chuyển khoản DV:", e);
        }
        
        return { isVnPay: false, message: 'Đã gửi yêu cầu thanh toán. Vui lòng chờ Admin xác nhận!' };
    }

    async processHeartbeat(maHoaDon) {
        const maTTInProg = await repo.layMaTrangThai('Đang thanh toán');
        const ls = await LS_TTHDDV.findOne({ where: { MaHDDV: maHoaDon, MaTT: maTTInProg }, order: [['MaLS', 'DESC']] });
        if (ls) {
            await sequelize.query('UPDATE LS_TTHDDV SET ThoiGianThayDoi = GETDATE(), GhiChu = :g WHERE MaLS = :m', { replacements: { g: 'Heartbeat – đang ở VNPay', m: ls.MaLS } });
        }
    }

    async processVnpayReturn(query) {
        const result = vnpayService.verifyCallback(query);
        if (result.isValid && result.responseCode === '00') {
            const maHoaDon = parseInt(result.txnRef);
            const maTT = await repo.layMaTrangThai('Đã thanh toán');
            if (maHoaDon && maTT) {
                await LS_TTHDDV.create({ MaHDDV: maHoaDon, MaTT: maTT, ThoiGianThayDoi: new Date(), GhiChu: `Thanh toán thành công VNPay - Mã GD: ${result.transactionNo || ''}` });
                try {
                    const hd = await HD_DichVu.findByPk(maHoaDon);
                    if (hd) {
                        const kh = await KhachHang.findByPk(hd.MaKH);
                        if (kh && kh.EmailKH) {
                            emailService.sendPaymentReceipt(kh.EmailKH, kh.TenKH, maHoaDon, 'Dịch vụ hệ thống', result.amount, 'VNPay');
                        }
                    }
                } catch (e) { console.error("Lỗi gửi mail biên lai:", e); }
            }
            return { success: true, result };
        }
        return { success: false, result };
    }
}
module.exports = new HoaDonDichVuService();