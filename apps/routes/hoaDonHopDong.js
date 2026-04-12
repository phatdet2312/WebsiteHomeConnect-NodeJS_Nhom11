// routes/hoaDonHopDong.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const vnpay = require('../services/vnpayService');
const { Op } = require('sequelize');
const { HD_HopDong, CT_HDHD, CT_ThanhToan, LoaiTTHD, CanHo, Tang, ToaNha, KyTT, HopDong, TrangThai, PTTT, LS_TTHDHD, KhachHang, sequelize } = require('../models');

router.use(isCustomer);

// ============================================================================
// HÀM HỖ TRỢ NGHIỆP VỤ 
// ============================================================================
async function layMaTrangThai(tenTT) {
    const tt = await TrangThai.findOne({ where: { TenTT: tenTT } });
    return tt ? tt.MaTT : null;
}

// ĐÃ FIX LOGIC KHÓA: Giống hệt dịch vụ, chỉ khóa khi đã thanh toán hoặc đang chạy VNPay 45s
async function getHoaDonBiKhoa(maTTPaid, maTTInProgress) {
    let paidRows = [];
    let inProgressRows = [];

    if (maTTPaid) {
        paidRows = await sequelize.query(
            `SELECT l.MaHDHD FROM LS_TTHDHD l
             INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS
             WHERE l.MaTT = :maTT`,
            { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }
        ).catch(() => []);
    }

    if (maTTInProgress) {
        inProgressRows = await sequelize.query(
            `SELECT l.MaHDHD FROM LS_TTHDHD l
             INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS
             WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`,
            { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProgress } }
        ).catch(() => []);
    }

    const paid = paidRows.map(r => r.MaHDHD);
    const inProg = inProgressRows.map(r => r.MaHDHD);
    return [...new Set([...paid, ...inProg])];
}

async function getTongDaThanhToan(maLoaiTT, maCanHo, maKyTT, hoaDonBiKhoa) {
    if (!hoaDonBiKhoa.length) return 0;
    const rows = await sequelize.query(
        `SELECT ISNULL(SUM(ct.DonGia * ct.SL), 0) as tongDaThanhToan FROM CT_HDHD ct
         WHERE ct.MaLoaiTT = :maLoaiTT AND ct.MaCanHo = :maCanHo AND ct.MaKyTT = :maKyTT AND ct.MaHDHD IN (:ids)`,
        { type: sequelize.QueryTypes.SELECT, replacements: { maLoaiTT, maCanHo, maKyTT, ids: hoaDonBiKhoa } }
    ).catch(() => [{ tongDaThanhToan: 0 }]);
    return parseInt(rows[0]?.tongDaThanhToan || 0);
}

// ============================================================================
// 1. ROUTES TRẢ VỀ GIAO DIỆN
// ============================================================================
router.get('/', (req, res) => res.render('hoaDonHopDong/index', { title: 'Lịch sử Hóa đơn Hợp đồng', layout: 'layouts/main' }));
router.get('/thanh-toan', (req, res) => res.render('hoaDonHopDong/thanhToan', { title: 'Thanh toán Hợp đồng', layout: 'layouts/main' }));

// ============================================================================
// 2. API ENDPOINTS (Giải quyết lỗi 404)
// ============================================================================
router.get('/api/danh-sach', async (req, res) => {
    try {
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, data: [] });

        const hopDongs = await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
        if (!hopDongs.length) return res.json({ success: true, data: [] });
        const maCanHoList = hopDongs.map(h => h.MaCanHo);

        const loaiTTHDs = await LoaiTTHD.findAll({ where: { TTHienThi: true } });
        
        // CẢI TIẾN: Chỉ ẩn số đếm khi "Đã thanh toán". Không truyền maTTInProgress để VẪN HIỂN THỊ BADGE NỢ.
        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, null);

        const ctThanhToans = await CT_ThanhToan.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
        
        const chuaThanhToanDict = {};
        for (const ct of ctThanhToans) {
            const paidAmount = await getTongDaThanhToan(ct.MaLoaiTT, ct.MaCanHo, ct.MaKyTT, hoaDonBiKhoa);
            if (ct.Gia - paidAmount > 0) {
                chuaThanhToanDict[ct.MaLoaiTT] = (chuaThanhToanDict[ct.MaLoaiTT] || 0) + 1;
            }
        }

        const data = loaiTTHDs.map(loai => ({
            maLoaiTT: loai.MaLoaiTT, 
            tenLoaiTT: loai.TenLoaiTT, 
            urlIcon: loai.UrlIcon, 
            soKyNo: chuaThanhToanDict[loai.MaLoaiTT] || 0
        }));

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/unpaid', async (req, res) => {
    try {
        const maLoaiTT = parseInt(req.query.maLoaiTT);
        if (!maLoaiTT) return res.json({ success: false, message: 'Thiếu mã loại thanh toán' });

        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng' });

        const hopDongs = await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
        const maCanHoList = hopDongs.map(h => h.MaCanHo);
        if (!maCanHoList.length) return res.json({ success: false, message: 'Bạn không có hợp đồng căn hộ đang hoạt động!' });

        // CẢI TIẾN: Vẫn cho người dùng xem danh sách các kỳ. Bỏ chặn hiển thị "Đang thanh toán"
        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, null); 

        // RAM MAPPING để chống lỗi Alias
        const ctList = await CT_ThanhToan.findAll({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHoList } });
        
        const maKys = [...new Set(ctList.map(c => c.MaKyTT))];
        const [canHos, kyTTs, loaiTT] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: maCanHoList }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            KyTT.findAll({ where: { MaKyTT: maKys } }),
            LoaiTTHD.findByPk(maLoaiTT)
        ]);

        const dictCanHo = {}; canHos.forEach(c => dictCanHo[c.MaCanHo] = c);
        const dictKy = {}; kyTTs.forEach(k => dictKy[k.MaKyTT] = k);

        const unpaidItems = [];
        for (const ct of ctList) {
            if (!ct.Gia || ct.Gia <= 0) continue;
            const tongDaThanhToan = await getTongDaThanhToan(ct.MaLoaiTT, ct.MaCanHo, ct.MaKyTT, hoaDonBiKhoa);
            const conThieu = parseInt(ct.Gia) - tongDaThanhToan;
            
            if (conThieu > 0) {
                const cH = dictCanHo[ct.MaCanHo];
                const kY = dictKy[ct.MaKyTT];

                unpaidItems.push({
                    maLoaiTT: ct.MaLoaiTT, maCanHo: ct.MaCanHo, maKyTT: ct.MaKyTT,
                    tenLoaiTT: loaiTT?.TenLoaiTT || '',
                    tenCanHo: cH?.TenCanHo || '',
                    toaNhaTang: cH ? `Tòa ${cH.Tang?.ToaNha?.TenToaNha || ''} - Tầng ${cH.Tang?.TenTang || ''}` : '',
                    tenKy: kY?.TenKyTT || '',
                    ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toLocaleDateString('vi-VN') : 'Không có hạn',
                    conThieu: conThieu
                });
            }
        }

        const pttts = await PTTT.findAll({ where: { TTHienThi: true }, order: [['TenPT', 'ASC']] });
        res.json({ success: true, unpaidItems, pttts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/history', async (req, res) => {
    try {
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, message: 'Tài khoản chưa liên kết hồ sơ khách hàng.' });

        const hopDongsOfKhach = await HopDong.findAll({ where: { MaKH: maKH } });
        const maHDs = hopDongsOfKhach.map(h => h.MaHopDong);
        if (!maHDs.length) return res.json({ success: true, data: [] });

        const hoaDons = await HD_HopDong.findAll({
            where: { MaHopDong: maHDs },
            include: [
                { model: LS_TTHDHD, as: 'LS_TTHDHDs', include: [{ model: TrangThai, as: 'TrangThai' }] },
                { model: PTTT, as: 'PTTT' }
            ],
            order: [['NgayThanhToan', 'DESC']]
        });

        if (!hoaDons.length) return res.json({ success: true, data: [] });
        const maHDHDList = hoaDons.map(h => h.MaHDHD);

        const ctHoaDons = await CT_HDHD.findAll({ where: { MaHDHD: maHDHDList } });

        const maCHs = [...new Set(ctHoaDons.map(c => c.MaCanHo))];
        const maLoaiTTs = [...new Set(ctHoaDons.map(c => c.MaLoaiTT))];
        const maKys = [...new Set(ctHoaDons.map(c => c.MaKyTT))];

        // BULLETPROOF RAM MAPPING
        const [canHos, loaiTTs, kyTTs] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: maCHs }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            LoaiTTHD.findAll({ where: { MaLoaiTT: maLoaiTTs } }),
            KyTT.findAll({ where: { MaKyTT: maKys } })
        ]);

        const dictCanHo = {}; canHos.forEach(c => dictCanHo[c.MaCanHo] = c);
        const dictLoaiTT = {}; loaiTTs.forEach(l => dictLoaiTT[l.MaLoaiTT] = l);
        const dictKy = {}; kyTTs.forEach(k => dictKy[k.MaKyTT] = k);

        const data = hoaDons.map(hd => {
            const lichSuSorted = (hd.LS_TTHDHDs || []).sort((a, b) => new Date(b.ThoiGianThayDoi) - new Date(a.ThoiGianThayDoi));
            const lastStatus = lichSuSorted.length > 0 && lichSuSorted[0].TrangThai ? lichSuSorted[0].TrangThai.TenTT : 'Chờ xử lý';

            const cts = ctHoaDons.filter(c => c.MaHDHD === hd.MaHDHD);
            const total = cts.reduce((sum, ct) => sum + (Number(ct.DonGia) * (ct.SL || 1)), 0);

            let viTriDaiDien = 'Chưa xác định';
            if (cts.length > 0) {
                const firstCH = dictCanHo[cts[0].MaCanHo];
                if (firstCH) {
                    const tenToa = firstCH.Tang?.ToaNha?.TenToaNha || 'N/A';
                    viTriDaiDien = `${firstCH.TenCanHo} (Tòa ${tenToa})`;
                }
            }

            const mappedChiTiet = cts.map(ct => {
                const lTT = dictLoaiTT[ct.MaLoaiTT];
                const kY = dictKy[ct.MaKyTT];
                const cH = dictCanHo[ct.MaCanHo];
                
                return {
                    tenLoaiTT: lTT ? lTT.TenLoaiTT : `Mã loại #${ct.MaLoaiTT}`,
                    tenKy: kY ? kY.TenKyTT : `Kỳ #${ct.MaKyTT}`,
                    tenCanHo: cH ? cH.TenCanHo : `CH #${ct.MaCanHo}`,
                    viTri: cH ? `Tòa ${cH.Tang?.ToaNha?.TenToaNha || 'N/A'} - Tầng ${cH.Tang?.TenTang || 'N/A'}` : 'N/A',
                    donGia: Number(ct.DonGia),
                    sl: ct.SL || 1
                };
            });

            return {
                maHDHD: hd.MaHDHD,
                ngayThanhToan: hd.NgayThanhToan,
                tongTien: total,
                phuongThuc: hd.PTTT?.TenPT || 'Chưa xác định',
                trangThaiHienTai: lastStatus,
                viTriDaiDien: viTriDaiDien,
                chiTiet: mappedChiTiet,
                lichSu: lichSuSorted.map(ls => ({
                    trangThai: ls.TrangThai ? ls.TrangThai.TenTT : 'N/A',
                    thoiGian: ls.ThoiGianThayDoi,
                    ghiChu: ls.GhiChu || ''
                }))
            };
        });

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/checkout', async (req, res) => {
    try {
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        const { maPT, items } = req.body; 

        if (!maKH) return res.json({ success: false, message: 'Lỗi định danh khách hàng' });
        if (!items || !items.length) return res.json({ success: false, message: 'Vui lòng chọn ít nhất 1 khoản thanh toán' });
        if (!maPT) return res.json({ success: false, message: 'Vui lòng chọn phương thức thanh toán' });

        const pttt = await PTTT.findByPk(maPT);
        if (!pttt) return res.json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });

        // Logic trạng thái giống Dịch vụ
        const isVnPay = pttt.TenPT.toLowerCase().includes('vnpay');
        const targetStatus = isVnPay ? 'Đang thanh toán' : 'Chờ thanh toán';

        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const maTTInProgress = await layMaTrangThai('Đang thanh toán');
        
        if (!maTTPaid || !maTTInProgress) {
            return res.json({ success: false, message: 'Lỗi hệ thống: Không tìm thấy các trạng thái cần thiết trong DB' });
        }

        // TẠI BƯỚC NÀY MỚI CHẶN THANH TOÁN (Radar 45s của VNPay + Trạng thái Đã thanh toán)
        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, maTTInProgress);
        const validItems = [];
        let tongTien = 0;

        for (const item of items) {
            const mLoaiTT = parseInt(item.maLoaiTT), mCH = parseInt(item.maCanHo), mKy = parseInt(item.maKyTT);
            const ct = await CT_ThanhToan.findOne({ where: { MaLoaiTT: mLoaiTT, MaCanHo: mCH, MaKyTT: mKy } });
            if (!ct || !ct.Gia || ct.Gia <= 0) continue;

            const paidAmount = await getTongDaThanhToan(mLoaiTT, mCH, mKy, hoaDonBiKhoa);
            const conThieu = parseInt(ct.Gia) - paidAmount;
            if (conThieu > 0) {
                validItems.push({ mLoaiTT, mCH, mKy, conThieu });
                tongTien += conThieu;
            }
        }

        if (!validItems.length) return res.json({ success: false, message: 'Giao dịch thất bại! Khoản này đang được người khác thanh toán qua VNPay hoặc đã thanh toán hoàn tất.' });

        const hopDongCurrent = await HopDong.findOne({ where: { MaKH: maKH, TrangThaiHD: true }, order: [['NgayLap', 'DESC']] });

        const hoaDon = await HD_HopDong.create({ 
            MaHopDong: hopDongCurrent ? hopDongCurrent.MaHopDong : null, 
            MaPT: parseInt(maPT), 
            NgayThanhToan: new Date() 
        });

        const ctRecords = validItems.map(vi => ({ 
            MaLoaiTT: vi.mLoaiTT, MaCanHo: vi.mCH, MaKyTT: vi.mKy, MaHDHD: hoaDon.MaHDHD, SL: 1, DonGia: vi.conThieu 
        }));
        await CT_HDHD.bulkCreate(ctRecords);

        const maTTFinal = await layMaTrangThai(targetStatus);
        await LS_TTHDHD.create({ MaHDHD: hoaDon.MaHDHD, MaTT: maTTFinal, ThoiGianThayDoi: new Date(), GhiChu: `Khởi tạo thanh toán qua ${pttt.TenPT}` });

        if (isVnPay) {
            const url = vnpay.createPaymentUrl(req, {
                amount: tongTien,
                orderInfo: `Thanh toan hop dong HomeConnect - HD#${hoaDon.MaHDHD}`,
                orderType: 'contract_payment',
                txnRef: String(hoaDon.MaHDHD),
                returnUrl: process.env.BASE_URL + '/hoa-don-hop-dong/vnpay-return'
            });
            return res.json({ success: true, isVnPay: true, redirectUrl: url, maHDHD: hoaDon.MaHDHD });
        }

        return res.json({ success: true, isVnPay: false, message: 'Đã gửi yêu cầu thanh toán. Vui lòng chờ Admin xác nhận!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/heartbeat', async (req, res) => {
    try {
        const maHoaDon = parseInt(req.body.maHoaDon);
        const maTTInProgress = await layMaTrangThai('Đang thanh toán');
        const lichSu = await LS_TTHDHD.findOne({ where: { MaHDHD: maHoaDon, MaTT: maTTInProgress }, order: [['MaLS', 'DESC']] });
        if (lichSu) {
            await sequelize.query(
                'UPDATE LS_TTHDHD SET ThoiGianThayDoi = GETDATE(), GhiChu = :ghichu WHERE MaLS = :maLS',
                { replacements: { ghichu: 'Heartbeat – người dùng đang ở cổng VNPay', maLS: lichSu.MaLS } }
            );
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/vnpay-return', async (req, res) => {
    try {
        const result = vnpay.verifyCallback(req.query);
        if (result.isValid && result.responseCode === '00') {
            const maHoaDon = parseInt(result.txnRef);
            const maTT = await layMaTrangThai('Đã thanh toán');
            if (maHoaDon && maTT) {
                await LS_TTHDHD.create({
                    MaHDHD: maHoaDon, MaTT: maTT, ThoiGianThayDoi: new Date(),
                    GhiChu: `Thanh toán thành công qua VNPay - Mã GD: ${result.transactionNo || ''}`
                });
            }
            return res.render('hoaDonHopDong/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: true, result });
        }
        res.render('hoaDonHopDong/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, result });
    } catch (err) {
        res.render('hoaDonHopDong/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, error: err.message });
    }
});

module.exports = router;