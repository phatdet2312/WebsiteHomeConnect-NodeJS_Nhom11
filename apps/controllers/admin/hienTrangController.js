const service = require('../../services/admin/hienTrangService');
const { HienTrangDTO } = require('../../dtos/admin/infrastructure.dto');

class HienTrangController {
    async renderList(req, res) {
        try {
            const { search, status, page = 1 } = req.query;
            const data = await service.getList(search, status, +page, 10);
            res.render('admin/hienTrang/index', { title: 'Quản lý Hiện trạng', layout: 'layouts/admin', items: data.items, totalItems: data.totalItems, search: search || '', status: status || '', currentPage: +page, totalPages: data.totalPages });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/dashboard'); }
    }
    async apiSearchSuggestions(req, res) {
        try { const q = req.query.q || ''; if (!q) return res.json([]); res.json(await service.getSearchSuggestions(q)); } catch (err) { res.json([]); }
    }
    renderAddForm(req, res) { res.render('admin/hienTrang/add', { title: 'Thêm Hiện trạng', layout: 'layouts/admin', item: null, errors: [] }); }
    async processAdd(req, res) {
        try {
            const dto = new HienTrangDTO(req.body);
            await service.create(dto);
            req.flash('success_msg', 'Thêm hiện trạng thành công');
            res.redirect('/admin/hien-trang');
        } catch (err) { res.render('admin/hienTrang/add', { title: 'Thêm Hiện trạng', layout: 'layouts/admin', item: req.body, errors: [err.message] }); }
    }
    async renderDisplay(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy hiện trạng'); return res.redirect('/admin/hien-trang'); }
            res.render('admin/hienTrang/display', { title: 'Chi tiết Hiện trạng', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
    async renderUpdateForm(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy hiện trạng'); return res.redirect('/admin/hien-trang'); }
            res.render('admin/hienTrang/update', { title: 'Cập nhật Hiện trạng', layout: 'layouts/admin', item, errors: [] });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
    async processUpdate(req, res) {
        try {
            const dto = new HienTrangDTO(req.body);
            await service.update(req.params.id, dto);
            req.flash('success_msg', 'Cập nhật hiện trạng thành công');
            res.redirect('/admin/hien-trang');
        } catch (err) {
            const item = await service.getDetail(req.params.id).catch(() => null);
            res.render('admin/hienTrang/update', { title: 'Cập nhật Hiện trạng', layout: 'layouts/admin', item: item || req.body, errors: [err.message] });
        }
    }
    async renderDeleteConfirm(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy hiện trạng'); return res.redirect('/admin/hien-trang'); }
            res.render('admin/hienTrang/delete', { title: 'Xóa Hiện trạng', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
    async processDelete(req, res) {
        try { await service.delete(req.params.id); req.flash('success_msg', 'Xóa hiện trạng thành công'); res.redirect('/admin/hien-trang'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
    async processBulkDelete(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await service.bulkDelete(ids);
            req.flash('success_msg', `Đã xóa ${ids.length} hiện trạng`);
            res.redirect('/admin/hien-trang');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
    async apiToggleStatus(req, res) {
        try { const newStatus = await service.toggleStatus(req.params.id); res.json({ success: true, newStatus }); }
        catch (err) { res.json({ success: false, message: err.message }); }
    }
    async processBulkStatus(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await service.bulkUpdateStatus(ids, req.body.status);
            req.flash('success_msg', 'Cập nhật trạng thái thành công');
            res.redirect('/admin/hien-trang');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/hien-trang'); }
    }
}
module.exports = new HienTrangController();