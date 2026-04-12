const express = require('express');
const router = express.Router();
const { ThongTinNguoiDung, KhachHang, NhanVien, VaiTroNhanVien } = require('../../models');
const { Op } = require('sequelize');

// --- Thuật toán chấm điểm tìm kiếm ---
function tinhSoTuKhop(user, tuKhoaArray) {
    let diem = 0;
    const email = ` ${(user.Email || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
    const hoTen = ` ${(user.HoTen || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
    for (const tu of tuKhoaArray) {
        if (email.includes(tu)) diem += 2;
        else if (hoTen.includes(tu)) diem += 1;
    }
    return diem;
}
function tinhSoKyTuKhop(user, tuKhoa) {
    let diem = 0;
    const email = (user.Email || '').toLowerCase();
    const hoTen = (user.HoTen || '').toLowerCase();
    const parts = tuKhoa.split(/\s+/).filter(Boolean);
    for (const tu of parts) {
        if (email.includes(tu)) diem += tu.length * 2;
        else if (hoTen.includes(tu)) diem += tu.length;
    }
    return diem;
}

// ============================================================================
// 1. ROUTES GIAO DIỆN
// ============================================================================
router.get('/', (req, res) => res.redirect('/admin/quan-ly-nguoi-dung/phan-quyen'));
router.get('/phan-quyen', (req, res) => res.render('admin/quanLyNguoiDung/phanQuyen', { title: 'Quản lý Người dùng & Phân quyền', layout: 'layouts/admin' }));
router.get('/phan-quyen/:userId', (req, res) => res.render('admin/quanLyNguoiDung/phanQuyenChiTiet', { title: 'Hồ sơ Người dùng', layout: 'layouts/admin', userId: req.params.userId }));

// ============================================================================
// 2. API ENDPOINTS
// ============================================================================

// API: Lấy danh sách Người dùng + Thống kê
router.get('/api/list', async (req, res) => {
    try {
        const { search='', trangThai='active', hoatDong='tatCa', page=1, limit=15 } = req.query;
        let users = await ThongTinNguoiDung.findAll({
            include: [
                { model: KhachHang, required: false, attributes: ['MaKH', 'TenKH'] },
                { model: NhanVien, required: false, attributes: ['MaNV', 'TenNV'], include: [{ model: VaiTroNhanVien, attributes: ['MaVTNV', 'ChucVu'] }] }
            ],
            order: [['HoTen', 'ASC']]
        });

        users = users.map(u => u.toJSON());
        const now = new Date();

        // 1. Tính toán thống kê tổng quan (Trước khi lọc)
        const stats = {
            total: users.length,
            active: users.filter(u => !u.LockoutEnd || new Date(u.LockoutEnd) <= now).length,
            locked: users.filter(u => u.LockoutEnd && new Date(u.LockoutEnd) > now).length,
            online: users.filter(u => u.TrangThaiHoatDong === true).length
        };

        // 2. Lọc Trạng thái
        if (trangThai === 'locked') users = users.filter(u => u.LockoutEnd && new Date(u.LockoutEnd) > now);
        else if (trangThai === 'active') users = users.filter(u => !u.LockoutEnd || new Date(u.LockoutEnd) <= now);

        // 3. Lọc Hoạt động
        if (hoatDong === 'online') users = users.filter(u => u.TrangThaiHoatDong === true);
        else if (hoatDong === 'offline') users = users.filter(u => !u.TrangThaiHoatDong);

        // 4. Tìm kiếm
        let ketQuaTimKiem = null, suggestions = [];
        if (search) {
            if (search.includes(',')) {
                const ids = search.split(',').map(s => s.trim()).filter(Boolean);
                const found = users.filter(u => ids.includes(u.Id));
                if (found.length > 0) users = found;
                else { ketQuaTimKiem = 'Không tìm thấy người dùng với ID đã nhập.'; suggestions = users.slice(0, 3); users = []; }
            } else {
                const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
                const scored = users.map(u => ({ u, diem: tinhSoTuKhop(u, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
                if (scored.length > 0) users = scored.map(x => x.u);
                else { ketQuaTimKiem = 'Không có người dùng liên quan.'; suggestions = users.slice(0, 3); users = []; }
            }
        }

        const totalItems = users.length;
        const paginatedData = users.slice((page - 1) * limit, page * limit);

        res.json({ 
            success: true, 
            data: paginatedData, 
            stats: stats, // Trả về bộ thống kê cho UI
            totalItems, 
            totalPages: Math.ceil(totalItems / limit), 
            currentPage: parseInt(page), 
            message: ketQuaTimKiem, 
            suggestions 
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/suggestions', async (req, res) => {
    try {
        const { term='' } = req.query;
        if (!term) return res.json({ success: true, data: [] });
        let users = await ThongTinNguoiDung.findAll();
        const scored = users.map(u => ({ u: u.toJSON(), diem: tinhSoKyTuKhop(u, term) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 5);
        res.json({ success: true, data: scored.map(x => x.u) });
    } catch (err) { res.json({ success: false, data: [] }); }
});

router.get('/api/detail/:userId', async (req, res) => {
    try {
        const user = await ThongTinNguoiDung.findByPk(req.params.userId, {
            include: [
                { model: KhachHang, required: false },
                { model: NhanVien, required: false, include: [{ model: VaiTroNhanVien }] }
            ]
        });
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        
        const allRoles = ['Admin', 'Manager', 'Staff', 'Accountant', 'Support'];
        const currentRoles = user.NhanVien ? user.NhanVien.VaiTroNhanViens.map(v => v.ChucVu) : [];
        
        res.json({ success: true, data: { ...user.toJSON(), AllRoles: allRoles, CurrentRoles: currentRoles } });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/change-status/:userId', async (req, res) => {
    try {
        const user = await ThongTinNguoiDung.findByPk(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'Người dùng không tồn tại.' });
        if (user.IsSuperAdmin && req.body.status === false) return res.status(403).json({ success: false, message: 'Không thể khóa tài khoản Super Admin.' });

        const isLocked = req.body.status === false;
        await user.update({ LockoutEnd: isLocked ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null }); 
        res.json({ success: true, message: isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/update-roles', async (req, res) => {
    try {
        const { userId, roles } = req.body;
        const user = await ThongTinNguoiDung.findByPk(userId);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });

        let nhanVien = await NhanVien.findOne({ where: { UserId: userId } });
        const selectedRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

        if (selectedRoles.length > 0) {
            if (!nhanVien) nhanVien = await NhanVien.create({ UserId: userId, TenNV: user.HoTen || user.UserName, EmailNV: user.Email });
            await VaiTroNhanVien.destroy({ where: { MaNV: nhanVien.MaNV } });
            for (const r of selectedRoles) await VaiTroNhanVien.create({ MaNV: nhanVien.MaNV, ChucVu: r.trim() });
        } else {
            if (nhanVien) {
                await VaiTroNhanVien.destroy({ where: { MaNV: nhanVien.MaNV } });
                await nhanVien.destroy();
            }
        }
        res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/bulk-action', async (req, res) => {
    try {
        const { ids, action } = req.body;
        const idArray = Array.isArray(ids) ? ids : (ids ? ids.split(',') : []);
        if (!idArray.length) return res.status(400).json({ success: false, message: 'Chưa chọn người dùng' });

        if (action === 'delete') {
            for (const id of idArray) {
                const u = await ThongTinNguoiDung.findByPk(id);
                if (u && !u.IsSuperAdmin) await u.destroy();
            }
            return res.json({ success: true, message: `Đã xóa ${idArray.length} người dùng` });
        } else if (action === 'lock') {
            for (const id of idArray) {
                const u = await ThongTinNguoiDung.findByPk(id);
                if (u && !u.IsSuperAdmin) await u.update({ LockoutEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) });
            }
            return res.json({ success: true, message: `Đã khóa ${idArray.length} người dùng` });
        }
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;