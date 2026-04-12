const service = require('../../services/admin/quanLyNguoiDungService');

class QuanLyNguoiDungController {
    renderIndex(req, res) { res.redirect('/admin/quan-ly-nguoi-dung/phan-quyen'); }
    renderPhanQuyen(req, res) { res.render('admin/quanLyNguoiDung/phanQuyen', { title: 'Quản lý Người dùng & Phân quyền', layout: 'layouts/admin' }); }
    renderChiTiet(req, res) { res.render('admin/quanLyNguoiDung/phanQuyenChiTiet', { title: 'Hồ sơ Người dùng', layout: 'layouts/admin', userId: req.params.userId }); }

    async apiGetList(req, res) {
        try { res.json({ success: true, ...await service.getList(req.query) }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiGetSuggestions(req, res) {
        try { res.json({ success: true, data: await service.getSuggestions(req.query.term) }); } 
        catch (err) { res.json({ success: false, data: [] }); }
    }

    async apiGetDetail(req, res) {
        try {
            const data = await service.getDetail(req.params.userId);
            if (!data) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.json({ success: true, data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiChangeStatus(req, res) {
        try {
            const isLocked = req.body.status === false;
            await service.toggleLock(req.params.userId, isLocked);
            res.json({ success: true, message: isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiUpdateRoles(req, res) {
        try {
            await service.updateRoles(req.body.userId, req.body.roles);
            res.json({ success: true, message: 'Cập nhật phân quyền thành công' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiBulkAction(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
            if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn người dùng' });
            await service.processBulkAction(ids, req.body.action);
            res.json({ success: true, message: `Thao tác thành công trên ${ids.length} người dùng` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new QuanLyNguoiDungController();