//apps/routes/quanLyLich.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const { Op } = require('sequelize');

router.use(isCustomer);

// ============================================================================
// 1. RENDER GIAO DIỆN
// ============================================================================
router.get('/', (_req, res) => {
    res.render('quanLyLich/index', { title: 'Quản lý lịch', layout: 'layouts/main' });
});

// ============================================================================
// 2. API CƠ BẢN (CRUD LỊCH)
// ============================================================================
router.get('/api/lich', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, message: 'Lỗi định danh' });

        const lichs = await Lich.findAll({ where: { MaKH: maKH }, order: [['MaLich', 'ASC']] });
        res.json({ success: true, data: lichs });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/lich', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const { TenLich, MauSac, MoTa } = req.body;
        if (!TenLich) return res.json({ success: false, message: 'Tên lịch không được để trống' });
        const lich = await Lich.create({ MaKH: req.user.dataValues.KhachHang.MaKH, TenLich, MauSac, MoTa });
        res.json({ success: true, message: 'Thêm lịch thành công', data: lich });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/api/lich/:id', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const lich = await Lich.findOne({ where: { MaLich: req.params.id, MaKH: req.user.dataValues.KhachHang.MaKH } });
        if (!lich) return res.json({ success: false, message: 'Từ chối quyền' });
        await lich.update(req.body);
        res.json({ success: true, message: 'Cập nhật thành công', data: lich });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/api/lich/:id', async (req, res) => {
    try {
        const { Lich } = require('../models');
        await Lich.destroy({ where: { MaLich: req.params.id, MaKH: req.user.dataValues.KhachHang.MaKH } });
        res.json({ success: true, message: 'Đã xóa lịch' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ============================================================================
// 3. SUPER API: AGGREGATE + GROUPING (GOM NHÓM HÓA ĐƠN CHỐNG RÁC MÀN HÌNH)
// ============================================================================
router.get('/api/su-kien', async (req, res) => {
    try {
        const { SuKien, Lich, HopDong, DichVu, CT_DichVu, CT_HDDV, LS_TTHDDV, TrangThai, CT_ThanhToan, LoaiTTHD, CT_HDHD, LS_TTHDHD, sequelize } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        const { thang, nam, maLich } = req.query;
        
        const targetMonthStart = new Date(parseInt(nam), parseInt(thang) - 1, 1);
        const targetMonthEnd   = new Date(parseInt(nam), parseInt(thang), 0, 23, 59, 59);
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const mappedEvents = [];

        // --- LUỒNG 1: SỰ KIỆN CÁ NHÂN ---
        const lichWhere = { MaKH: maKH };
        if (maLich) lichWhere.MaLich = maLich;
        const lichs = await Lich.findAll({ where: lichWhere, attributes: ['MaLich'] });
        const maLichList = lichs.map(l => l.MaLich);
        
        if (maLichList.length > 0) {
            const events = await SuKien.findAll({ 
                where: { 
                    MaLich: maLichList,
                    ThoiGianBatDau: { [Op.lte]: targetMonthEnd },
                    ThoiGIanKetThuc: { [Op.gte]: targetMonthStart }
                }, 
                include: [{ model: Lich, as: 'Lich' }],
                order: [['ThoiGianBatDau', 'ASC']]
            });

            events.forEach(e => {
                mappedEvents.push({
                    id: 'evt_' + e.MaSuKien, originalId: e.MaSuKien, maLich: e.MaLich,
                    type: 'personal', title: e.TieuDe, 
                    start: new Date(e.ThoiGianBatDau).toISOString(), 
                    end: new Date(e.ThoiGIanKetThuc).toISOString(), 
                    color: e.Lich?.MauSac || '#0061ff', location: e.DiaDiem || '', description: e.MoTa || ''
                });
            });
        }

        // --- LUỒNG 2 & 3: HÓA ĐƠN (Chỉ hiển thị khi xem "Tất cả Lịch") ---
        if (!maLich && maKH) {
            const activeHopDongs = await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
            const maCanHoList = activeHopDongs.map(h => h.MaCanHo);

            if (maCanHoList.length > 0) {
                const tPaid = await TrangThai.findOne({ where: { TenTT: 'Đã thanh toán' } });
                const tProg = await TrangThai.findOne({ where: { TenTT: 'Đang thanh toán' } });

                // --- XỬ LÝ DỊCH VỤ (GOM NHÓM THEO LOẠI DỊCH VỤ) ---
                let lockedHDDV = [];
                if (tPaid) {
                    const pRows = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = ${tPaid.MaTT}`, { type: sequelize.QueryTypes.SELECT });
                    lockedHDDV.push(...pRows.map(r=>r.MaHDDV));
                }
                if (tProg) {
                    const iRows = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = ${tProg.MaTT} AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT });
                    lockedHDDV.push(...iRows.map(r=>r.MaHDDV));
                }

                const paidDVMap = {};
                if (lockedHDDV.length > 0) {
                    const ct_hddvs = await CT_HDDV.findAll({ where: { MaHDDV: lockedHDDV }});
                    ct_hddvs.forEach(ct => { paidDVMap[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] = (paidDVMap[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] || 0) + (ct.DonGia * (ct.SL || 1)); });
                }

                const ctDVs = await CT_DichVu.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
                const dictDV = {}; const dvs = await DichVu.findAll(); dvs.forEach(d => dictDV[d.MaDV] = d);

                // GOM NHÓM DỊCH VỤ CÙNG NGÀY & CÙNG LOẠI
                const groupedDV = {};
                ctDVs.forEach(ct => {
                    const paid = paidDVMap[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] || 0;
                    const conThieu = parseInt(ct.Gia) - paid;
                    
                    if (conThieu > 0) {
                        let dueDate = ct.NgayDenHan ? new Date(ct.NgayDenHan) : null;
                        let isOverdue = false;
                        let displayDate = todayStart;

                        // ĐÃ FIX: Logic sắp xếp ngày chuẩn UI/UX
                        if (dueDate) {
                            if (isNaN(dueDate.getTime())) {
                                displayDate = todayStart; // Chuỗi ngày lỗi -> gom về hôm nay
                            } else {
                                dueDate.setHours(0,0,0,0);
                                if (dueDate < todayStart) {
                                    isOverdue = true;
                                    displayDate = todayStart; // Quá hạn -> gom về hôm nay để chớp đỏ
                                } else {
                                    displayDate = dueDate; // Chưa đến hạn -> nằm đúng ngày trên lịch
                                }
                            }
                        }

                        // Gom nhóm theo (Mã Dịch Vụ + Ngày Hiển Thị) để không bị đè nhau
                        const groupKey = `${ct.MaDV}_${displayDate.getTime()}`;

                        if (!groupedDV[groupKey]) {
                            groupedDV[groupKey] = { 
                                maDV: ct.MaDV, tenDV: dictDV[ct.MaDV]?.TenDV || 'Dịch vụ',
                                tongTien: 0, soKy: 0, isOverdue: isOverdue, displayDate: displayDate
                            };
                        }
                        groupedDV[groupKey].tongTien += conThieu;
                        groupedDV[groupKey].soKy += 1;
                        
                        // Nếu trong nhóm có 1 khoản quá hạn, cả nhóm chớp đỏ
                        if (isOverdue) groupedDV[groupKey].isOverdue = true; 
                    }
                });

                Object.values(groupedDV).forEach(g => {
                    if (g.displayDate >= targetMonthStart && g.displayDate <= targetMonthEnd) {
                        mappedEvents.push({
                            id: `dv_group_${g.maDV}_${g.displayDate.getTime()}`, type: 'dich-vu',
                            title: `${g.tenDV} (${g.soKy} kỳ)`,
                            start: g.displayDate.toISOString(), end: g.displayDate.toISOString(),
                            color: g.isOverdue ? '#ef4444' : '#f59e0b', isOverdue: g.isOverdue, amount: g.tongTien,
                            description: `Bạn có ${g.soKy} kỳ nợ chưa thanh toán.`,
                            url: `/hoa-don-dich-vu/thanh-toan?maDV=${g.maDV}`
                        });
                    }
                });

                // --- XỬ LÝ HỢP ĐỒNG (GOM NHÓM THEO LOẠI HỢP ĐỒNG) ---
                let lockedHDHD = [];
                if (tPaid) {
                    const pHRows = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = ${tPaid.MaTT}`, { type: sequelize.QueryTypes.SELECT });
                    lockedHDHD.push(...pHRows.map(r=>r.MaHDHD));
                }
                if (tProg) {
                    const iHRows = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = ${tProg.MaTT} AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT });
                    lockedHDHD.push(...iHRows.map(r=>r.MaHDHD));
                }

                const paidHDMap = {};
                if (lockedHDHD.length > 0) {
                    const ct_hdhds = await CT_HDHD.findAll({ where: { MaHDHD: lockedHDHD }});
                    ct_hdhds.forEach(ct => { paidHDMap[`${ct.MaLoaiTT}_${ct.MaCanHo}_${ct.MaKyTT}`] = (paidHDMap[`${ct.MaLoaiTT}_${ct.MaCanHo}_${ct.MaKyTT}`] || 0) + (ct.DonGia * (ct.SL || 1)); });
                }

                const ctHDs = await CT_ThanhToan.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
                const dictLoai = {}; const loais = await LoaiTTHD.findAll(); loais.forEach(l => dictLoai[l.MaLoaiTT] = l);

                // GOM NHÓM HỢP ĐỒNG CÙNG NGÀY & CÙNG LOẠI
                const groupedHD = {};
                ctHDs.forEach(ct => {
                    const paid = paidHDMap[`${ct.MaLoaiTT}_${ct.MaCanHo}_${ct.MaKyTT}`] || 0;
                    const conThieu = parseInt(ct.Gia) - paid;
                    if (conThieu > 0) {
                        let dueDate = ct.NgayDenHan ? new Date(ct.NgayDenHan) : null;
                        let isOverdue = false;
                        let displayDate = todayStart;

                        if (dueDate) {
                            if (isNaN(dueDate.getTime())) {
                                displayDate = todayStart;
                            } else {
                                dueDate.setHours(0,0,0,0);
                                if (dueDate < todayStart) {
                                    isOverdue = true;
                                    displayDate = todayStart;
                                } else {
                                    displayDate = dueDate;
                                }
                            }
                        }

                        const groupKey = `${ct.MaLoaiTT}_${displayDate.getTime()}`;

                        if (!groupedHD[groupKey]) {
                            groupedHD[groupKey] = {
                                maLoaiTT: ct.MaLoaiTT, tenLoaiTT: dictLoai[ct.MaLoaiTT]?.TenLoaiTT || 'Hợp đồng',
                                tongTien: 0, soKy: 0, isOverdue: isOverdue, displayDate: displayDate
                            };
                        }
                        groupedHD[groupKey].tongTien += conThieu;
                        groupedHD[groupKey].soKy += 1;

                        if (isOverdue) groupedHD[groupKey].isOverdue = true;
                    }
                });

                Object.values(groupedHD).forEach(g => {
                    if (g.displayDate >= targetMonthStart && g.displayDate <= targetMonthEnd) {
                        mappedEvents.push({
                            id: `hd_group_${g.maLoaiTT}_${g.displayDate.getTime()}`, type: 'hop-dong',
                            title: `${g.tenLoaiTT} (${g.soKy} khoản)`,
                            start: g.displayDate.toISOString(), end: g.displayDate.toISOString(),
                            color: g.isOverdue ? '#e11d48' : '#8b5cf6', isOverdue: g.isOverdue, amount: g.tongTien,
                            description: `Bạn có ${g.soKy} khoản chưa thanh toán.`,
                            url: `/hoa-don-hop-dong/thanh-toan?maLoaiTT=${g.maLoaiTT}`
                        });
                    }
                });
            }
        }
        
        res.json({ success: true, data: mappedEvents });
    } catch (err) { 
        console.error("Lỗi API /su-kien:", err); 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

router.post('/api/su-kien', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const { MaLich, TieuDe, ThoiGianBatDau, ThoiGIanKetThuc, MoTa, DiaDiem } = req.body;
        const lich = await Lich.findOne({ where: { MaLich, MaKH: req.user.dataValues.KhachHang.MaKH } });
        if (!lich) return res.json({ success: false, message: 'Lịch không hợp lệ' });
        const suKien = await SuKien.create({ MaLich, TieuDe, ThoiGianBatDau, ThoiGIanKetThuc, MoTa, DiaDiem });
        res.json({ success: true, message: 'Đã thêm', data: suKien });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/api/su-kien/:id', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const suKien = await SuKien.findByPk(req.params.id, { include: [{ model: Lich, as: 'Lich' }] });
        if (!suKien || suKien.Lich.MaKH !== req.user.dataValues.KhachHang.MaKH) return res.json({ success: false });
        await suKien.update(req.body);
        res.json({ success: true, message: 'Đã cập nhật' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/api/su-kien/:id', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const suKien = await SuKien.findByPk(req.params.id, { include: [{ model: Lich, as: 'Lich' }] });
        if (!suKien || suKien.Lich.MaKH !== req.user.dataValues.KhachHang.MaKH) return res.json({ success: false });
        await suKien.destroy();
        res.json({ success: true, message: 'Đã xóa' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;