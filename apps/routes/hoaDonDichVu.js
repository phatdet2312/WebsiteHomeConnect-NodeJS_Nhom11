
// apps/routes/hoaDonDichVu.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const vnpay = require('../services/vnpayService');
const { Op } = require('sequelize');
const { HD_DichVu, CT_HDDV, CT_DichVu, DichVu, CanHo, Tang, ToaNha, Ky, HopDong, TrangThai, PTTT, LS_TTHDDV, KhachHang, sequelize } = require('../models');

router.use(isCustomer);

// ============================================================================
// HÀM HỖ TRỢ NGHIỆP VỤ 
// ============================================================================
async function layMaTrangThai(tenTT) {
    const tt = await TrangThai.findOne({ where: { TenTT: tenTT } });
    return tt ? tt.MaTT : null;
}

async function getHoaDonBiKhoa(maTTPaid, maTTInProgress) {
    let paidRows = [];
    let inProgressRows = [];

    if (maTTPaid) {
        paidRows = await sequelize.query(
            `SELECT l.MaHDDV FROM LS_TTHDDV l
             INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS
             WHERE l.MaTT = :maTT`,
            { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }
        ).catch(() => []);
    }

    // Chỉ truy vấn khóa VNPay 45s nếu biến maTTInProgress được truyền vào (lúc Checkout)
    if (maTTInProgress) {
        inProgressRows = await sequelize.query(
            `SELECT l.MaHDDV FROM LS_TTHDDV l
             INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS
             WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`,
            { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProgress } }
        ).catch(() => []);
    }

    const paid = paidRows.map(r => r.MaHDDV);
    const inProg = inProgressRows.map(r => r.MaHDDV);
    return [...new Set([...paid, ...inProg])];
}

async function getTongDaThanhToan(maDV, maCanHo, maKy, hoaDonBiKhoa) {
    if (!hoaDonBiKhoa.length) return 0;
    const rows = await sequelize.query(
        `SELECT ISNULL(SUM(ct.DonGia * ct.SL), 0) as tongDaThanhToan FROM CT_HDDV ct
         WHERE ct.MaDV = :maDV AND ct.MaCanHo = :maCanHo AND ct.MaKy = :maKy AND ct.MaHDDV IN (:ids)`,
        { type: sequelize.QueryTypes.SELECT, replacements: { maDV, maCanHo, maKy, ids: hoaDonBiKhoa } }
    ).catch(() => [{ tongDaThanhToan: 0 }]);
    return parseInt(rows[0]?.tongDaThanhToan || 0);
}

// ============================================================================
// 1. ROUTES TRẢ VỀ GIAO DIỆN
// ============================================================================
router.get('/', (req, res) => res.render('hoaDonDichVu/index', { title: 'Lịch sử Hóa đơn Dịch vụ', layout: 'layouts/main' }));
router.get('/thanh-toan', (req, res) => res.render('hoaDonDichVu/thanhToan', { title: 'Thanh toán dịch vụ', layout: 'layouts/main' }));

// ============================================================================
// 2. API ENDPOINTS
// ============================================================================
router.get('/api/danh-sach', async (req, res) => {
    try {
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, data: [] });

        const hopDongs = await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
        if (!hopDongs.length) return res.json({ success: true, data: [] });
        const maCanHoList = hopDongs.map(h => h.MaCanHo);

        const dichVus = await DichVu.findAll({ where: { TTHienThi: true } });
        
        // CẢI TIẾN: Chỉ ẩn khi "Đã thanh toán". Không truyền maTTInProgress để VẪN HIỂN THỊ BADGE NỢ.
        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, null);

        const ctDichVus = await CT_DichVu.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
        
        const chuaThanhToanDict = {};
        for (const ct of ctDichVus) {
            const paidAmount = await getTongDaThanhToan(ct.MaDV, ct.MaCanHo, ct.MaKy, hoaDonBiKhoa);
            if (ct.Gia - paidAmount > 0) {
                chuaThanhToanDict[ct.MaDV] = (chuaThanhToanDict[ct.MaDV] || 0) + 1;
            }
        }

        const data = dichVus.map(dv => ({
            maDV: dv.MaDV, tenDV: dv.TenDV, urlIcon: dv.UrlIcon, soKyNo: chuaThanhToanDict[dv.MaDV] || 0
        }));

        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/unpaid', async (req, res) => {
    try {
        const maDV = parseInt(req.query.maDV);
        if (!maDV) return res.json({ success: false, message: 'Thiếu mã dịch vụ' });

        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, message: 'Không tìm thấy hồ sơ khách hàng' });

        const hopDongs = await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
        const maCanHoList = hopDongs.map(h => h.MaCanHo);
        if (!maCanHoList.length) return res.json({ success: false, message: 'Bạn không có hợp đồng căn hộ đang hoạt động!' });

        // CẢI TIẾN YÊU CẦU: Vẫn cho người dùng xem danh sách các kỳ. Bỏ chặn hiển thị "Đang thanh toán"
        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, null);

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
            const tongDaThanhToan = await getTongDaThanhToan(ct.MaDV, ct.MaCanHo, ct.MaKy, hoaDonBiKhoa);
            const conThieu = parseInt(ct.Gia) - tongDaThanhToan;
            if (conThieu > 0) {
                unpaidItems.push({
                    maDV: ct.MaDV, maCanHo: ct.MaCanHo, maKy: ct.MaKy,
                    tenDV: ct.DichVu?.TenDV || '',
                    tenCanHo: ct.CanHo?.TenCanHo || '',
                    toaNhaTang: `${ct.CanHo?.Tang?.ToaNha?.TenToaNha || ''} - Tầng ${ct.CanHo?.Tang?.TenTang || ''}`,
                    tenKy: ct.Ky?.TenKy || '',
                    ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toLocaleDateString('vi-VN') : 'Không có hạn',
                    conThieu: conThieu,
                    urlAnh: ct.urlAnh || ''
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

        const hoaDons = await HD_DichVu.findAll({
            where: { MaKH: maKH },
            include: [
                { model: LS_TTHDDV, as: 'LS_TTHDDVs', include: [{ model: TrangThai, as: 'TrangThai' }] },
                { model: PTTT, as: 'PTTT' }
            ],
            order: [['NgayThanhToan', 'DESC']]
        });

        if (!hoaDons.length) return res.json({ success: true, data: [] });
        const maHDList = hoaDons.map(h => h.MaHDDV);

        const ctHoaDons = await CT_HDDV.findAll({ 
            where: { MaHDDV: maHDList }
        });

        const maCHs = [...new Set(ctHoaDons.map(c => c.MaCanHo))];
        const maDVs = [...new Set(ctHoaDons.map(c => c.MaDV))];
        const maKys = [...new Set(ctHoaDons.map(c => c.MaKy))];

        const ctDichVus = await CT_DichVu.findAll({
            where: {
                [Op.or]: ctHoaDons.map(c => ({ MaDV: c.MaDV, MaCanHo: c.MaCanHo, MaKy: c.MaKy }))
            }
        });
        const dictCTDichVu = {};
        ctDichVus.forEach(ct => {
            dictCTDichVu[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] = ct;
        });

        const [canHos, dichVus, kys] = await Promise.all([
            CanHo.findAll({ where: { MaCanHo: maCHs }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }] }),
            DichVu.findAll({ where: { MaDV: maDVs } }),
            Ky.findAll({ where: { MaKy: maKys } })
        ]);

        const dictCanHo = {}; canHos.forEach(c => dictCanHo[c.MaCanHo] = c);
        const dictDichVu = {}; dichVus.forEach(d => dictDichVu[d.MaDV] = d);
        const dictKy = {}; kys.forEach(k => dictKy[k.MaKy] = k);

        const data = hoaDons.map(hd => {
            const lichSuSorted = (hd.LS_TTHDDVs || []).sort((a, b) => new Date(b.ThoiGianThayDoi) - new Date(a.ThoiGianThayDoi));
            const lastStatus = lichSuSorted.length > 0 && lichSuSorted[0].TrangThai ? lichSuSorted[0].TrangThai.TenTT : 'Chờ xử lý';

            const cts = ctHoaDons.filter(c => c.MaHDDV === hd.MaHDDV);
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
                const dV = dictDichVu[ct.MaDV];
                const kY = dictKy[ct.MaKy];
                const cH = dictCanHo[ct.MaCanHo];
                const ctDvGoc = dictCTDichVu[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] || {};
                
                return {
                    tenDV: dV ? dV.TenDV : `Dịch vụ #${ct.MaDV}`,
                    tenKy: kY ? kY.TenKy : `Kỳ #${ct.MaKy}`,
                    tenCanHo: cH ? cH.TenCanHo : `CH #${ct.MaCanHo}`,
                    viTri: cH ? `Tòa ${cH.Tang?.ToaNha?.TenToaNha || 'N/A'} - Tầng ${cH.Tang?.TenTang || 'N/A'}` : 'N/A',
                    donGia: Number(ct.DonGia),
                    sl: ct.SL || 1,
                    urlAnh: ctDvGoc.urlAnh || '' 
                };
            });

            return {
                maHDDV: hd.MaHDDV,
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
        if (!items || !items.length) return res.json({ success: false, message: 'Vui lòng chọn ít nhất 1 kỳ thanh toán' });
        if (!maPT) return res.json({ success: false, message: 'Vui lòng chọn phương thức thanh toán' });

        const pttt = await PTTT.findByPk(maPT);
        if (!pttt) return res.json({ success: false, message: 'Phương thức thanh toán không hợp lệ' });

        const isVnPay = pttt.TenPT.toLowerCase().includes('vnpay');
        const targetStatus = isVnPay ? 'Đang thanh toán' : 'Chờ thanh toán';

        // TẠI BƯỚC NÀY MỚI CHẶN THANH TOÁN (Radar 45s của VNPay + Trạng thái Đã thanh toán)
        const maTTPaid = await layMaTrangThai('Đã thanh toán');
        const maTTInProgress = await layMaTrangThai('Đang thanh toán');
        
        if (!maTTPaid || !maTTInProgress) {
            return res.json({ success: false, message: 'Lỗi hệ thống: Không tìm thấy mã trạng thái' });
        }

        const hoaDonBiKhoa = await getHoaDonBiKhoa(maTTPaid, maTTInProgress);
        const validItems = [];
        let tongTien = 0;

        for (const item of items) {
            const mDV = parseInt(item.maDV), mCH = parseInt(item.maCanHo), mKy = parseInt(item.maKy);
            const ct = await CT_DichVu.findOne({ where: { MaDV: mDV, MaCanHo: mCH, MaKy: mKy } });
            if (!ct || !ct.Gia || ct.Gia <= 0) continue;

            const paidAmount = await getTongDaThanhToan(mDV, mCH, mKy, hoaDonBiKhoa);
            const conThieu = parseInt(ct.Gia) - paidAmount;
            if (conThieu > 0) {
                validItems.push({ mDV, mCH, mKy, conThieu });
                tongTien += conThieu;
            }
        }

        if (!validItems.length) return res.json({ success: false, message: 'Giao dịch thất bại! Kỳ dịch vụ này đang được người khác thanh toán qua VNPay hoặc đã được thanh toán hoàn tất.' });

        const hoaDon = await HD_DichVu.create({ MaKH: maKH, MaPT: parseInt(maPT), NgayThanhToan: new Date() });
        const ctRecords = validItems.map(vi => ({ MaDV: vi.mDV, MaCanHo: vi.mCH, MaKy: vi.mKy, MaHDDV: hoaDon.MaHDDV, SL: 1, DonGia: vi.conThieu }));
        await CT_HDDV.bulkCreate(ctRecords);

        const maTTFinal = await layMaTrangThai(targetStatus);
        await LS_TTHDDV.create({ MaHDDV: hoaDon.MaHDDV, MaTT: maTTFinal, ThoiGianThayDoi: new Date(), GhiChu: `Khởi tạo thanh toán qua ${pttt.TenPT}` });

        if (isVnPay) {
            const url = vnpay.createPaymentUrl(req, {
                amount: tongTien,
                orderInfo: `Thanh toan dich vu HomeConnect - HD#${hoaDon.MaHDDV}`,
                orderType: 'service_payment',
                txnRef: String(hoaDon.MaHDDV),
                returnUrl: process.env.BASE_URL + '/hoa-don-dich-vu/vnpay-return'
            });
            return res.json({ success: true, isVnPay: true, redirectUrl: url, maHDDV: hoaDon.MaHDDV });
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
        const lichSu = await LS_TTHDDV.findOne({ where: { MaHDDV: maHoaDon, MaTT: maTTInProgress }, order: [['MaLS', 'DESC']] });
        if (lichSu) {
            await sequelize.query(
                'UPDATE LS_TTHDDV SET ThoiGianThayDoi = GETDATE(), GhiChu = :ghichu WHERE MaLS = :maLS',
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
                await LS_TTHDDV.create({
                    MaHDDV: maHoaDon, MaTT: maTT, ThoiGianThayDoi: new Date(),
                    GhiChu: `Thanh toán thành công qua VNPay - Mã GD: ${result.transactionNo || ''}`
                });
            }
            return res.render('hoaDonDichVu/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: true, result });
        }
        res.render('hoaDonDichVu/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, result });
    } catch (err) {
        res.render('hoaDonDichVu/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, error: err.message });
    }
});

module.exports = router;