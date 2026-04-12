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
// 2. API ENDPOINTS CHO LỊCH (CALENDAR)
// ============================================================================

// [API] Lấy danh sách Lịch của user
router.get('/api/lich', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        if (!maKH) return res.json({ success: false, message: 'Lỗi định danh khách hàng' });

        const lichs = await Lich.findAll({ 
            where: { MaKH: maKH },
            order: [['MaLich', 'ASC']]
        });
        res.json({ success: true, data: lichs });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// [API] Thêm Lịch mới
router.post('/api/lich', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        const { TenLich, MauSac, MoTa } = req.body;

        if (!TenLich) return res.json({ success: false, message: 'Tên lịch không được để trống' });

        const lich = await Lich.create({ MaKH: maKH, TenLich, MauSac, MoTa });
        res.json({ success: true, message: 'Thêm lịch thành công', data: lich });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// [API] Sửa Lịch
router.put('/api/lich/:id', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        
        const lich = await Lich.findOne({ where: { MaLich: req.params.id, MaKH: maKH } });
        if (!lich) return res.json({ success: false, message: 'Không tìm thấy lịch hoặc không có quyền' });
        
        await lich.update(req.body);
        res.json({ success: true, message: 'Cập nhật lịch thành công', data: lich });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// [API] Xóa Lịch (Cascade xóa luôn sự kiện)
router.delete('/api/lich/:id', async (req, res) => {
    try {
        const { Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        
        const deleted = await Lich.destroy({ where: { MaLich: req.params.id, MaKH: maKH } });
        if (!deleted) return res.json({ success: false, message: 'Lịch không tồn tại' });
        
        res.json({ success: true, message: 'Đã xóa lịch và các sự kiện liên quan' });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// ============================================================================
// 3. API ENDPOINTS CHO SỰ KIỆN (EVENTS)
// ============================================================================

// [API] Lấy danh sách sự kiện theo Tháng/Năm
router.get('/api/su-kien', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        const { thang, nam, maLich } = req.query;
        
        // Xác định các lịch thuộc quyền sở hữu của User
        const lichWhere = { MaKH: maKH };
        if (maLich) lichWhere.MaLich = maLich;
        
        const lichs = await Lich.findAll({ where: lichWhere, attributes: ['MaLich'] });
        const maLichList = lichs.map(l => l.MaLich);
        if(!maLichList.length) return res.json({ success: true, data: [] });
        
        const where = { MaLich: maLichList };
        
        // Thuật toán quét sự kiện giao nhau với Tháng hiện tại
        if (thang && nam) {
            const startOfMonth = new Date(parseInt(nam), parseInt(thang) - 1, 1);
            const endOfMonth   = new Date(parseInt(nam), parseInt(thang), 0, 23, 59, 59);
            
            where.ThoiGianBatDau = { [Op.lte]: endOfMonth };
            where.ThoiGIanKetThuc = { [Op.gte]: startOfMonth };
        }
        
        const events = await SuKien.findAll({ 
            where, 
            include: [{ model: Lich, as: 'Lich' }],
            order: [['ThoiGianBatDau', 'ASC']]
        });
        
        res.json({ success: true, data: events });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// [API] Thêm sự kiện
router.post('/api/su-kien', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        const { MaLich, TieuDe, ThoiGianBatDau, ThoiGIanKetThuc, MoTa, DiaDiem } = req.body;
        
        const lich = await Lich.findOne({ where: { MaLich, MaKH: maKH } });
        if (!lich) return res.json({ success: false, message: 'Không tìm thấy lịch hợp lệ' });
        
        if (new Date(ThoiGianBatDau) >= new Date(ThoiGIanKetThuc)) {
            return res.json({ success: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }

        const suKien = await SuKien.create({ MaLich, TieuDe, ThoiGianBatDau, ThoiGIanKetThuc, MoTa, DiaDiem });
        res.json({ success: true, message: 'Thêm sự kiện thành công', data: suKien });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// [API] Sửa sự kiện
router.put('/api/su-kien/:id', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        
        const suKien = await SuKien.findByPk(req.params.id, { include: [{ model: Lich, as: 'Lich' }] });
        if (!suKien || suKien.Lich.MaKH !== maKH) return res.json({ success: false, message: 'Từ chối quyền truy cập' });
        
        if (new Date(req.body.ThoiGianBatDau) >= new Date(req.body.ThoiGIanKetThuc)) {
            return res.json({ success: false, message: 'Thời gian kết thúc phải sau thời gian bắt đầu' });
        }

        await suKien.update(req.body);
        res.json({ success: true, message: 'Cập nhật sự kiện thành công' });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

// [API] Xóa sự kiện
router.delete('/api/su-kien/:id', async (req, res) => {
    try {
        const { SuKien, Lich } = require('../models');
        const maKH = req.user.dataValues.KhachHang?.MaKH;
        
        const suKien = await SuKien.findByPk(req.params.id, { include: [{ model: Lich, as: 'Lich' }] });
        if (!suKien || suKien.Lich.MaKH !== maKH) return res.json({ success: false, message: 'Từ chối quyền truy cập' });
        
        await suKien.destroy();
        res.json({ success: true, message: 'Đã xóa sự kiện' });
    } catch (err) { 
        res.status(500).json({ success: false, message: err.message }); 
    }
});

module.exports = router;