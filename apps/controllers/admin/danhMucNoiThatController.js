const service = require('../../services/admin/danhMucNoiThatService');
const { DanhMucNoiThatDTO } = require('../../dtos/admin/apartment.dto');

class DanhMucNoiThatController {
    // ... logic giống TangController, thay thế `danh-muc-noi-that` ...
    async renderList(req, res) {
        try {
            const { search, status, page = 1 } = req.query;
            const data = await service.getList(search, status, +page, 10);
            res.render('admin/danhMucNoiThat/index', { title: 'Quản lý Danh mục Nội thất', layout: 'layouts/admin', items: data.items, totalItems: data.totalItems, search: search || '', status: status || '', currentPage: +page, totalPages: data.totalPages });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/dashboard'); }
    }
    async apiSearchSuggestions(req, res) { try { const q = req.query.q || ''; if (!q) return res.json([]); res.json(await service.getSearchSuggestions(q)); } catch (err) { res.json([]); } }
    renderAddForm(req, res) { res.render('admin/danhMucNoiThat/add', { title: 'Thêm', layout: 'layouts/admin', item: null, errors: [] }); }
    async processAdd(req, res) {
        try { const dto = new DanhMucNoiThatDTO(req.body); await service.create(dto); req.flash('success_msg', 'Thêm thành công'); res.redirect('/admin/danh-muc-noi-that'); }
        catch (err) { res.render('admin/danhMucNoiThat/add', { title: 'Thêm', layout: 'layouts/admin', item: req.body, errors: [err.message] }); }
    }
    async renderDisplay(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/danh-muc-noi-that'); } res.render('admin/danhMucNoiThat/display', { title: 'Chi tiết', layout: 'layouts/admin', item }); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
    async renderUpdateForm(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/danh-muc-noi-that'); } res.render('admin/danhMucNoiThat/update', { title: 'Cập nhật', layout: 'layouts/admin', item, errors: [] }); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
    async processUpdate(req, res) {
        try { const dto = new DanhMucNoiThatDTO(req.body); await service.update(req.params.id, dto); req.flash('success_msg', 'Cập nhật thành công'); res.redirect('/admin/danh-muc-noi-that'); }
        catch (err) { const item = await service.getDetail(req.params.id).catch(() => null); res.render('admin/danhMucNoiThat/update', { title: 'Cập nhật', layout: 'layouts/admin', item: item || req.body, errors: [err.message] }); }
    }
    async renderDeleteConfirm(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/danh-muc-noi-that'); } res.render('admin/danhMucNoiThat/delete', { title: 'Xóa', layout: 'layouts/admin', item }); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
    async processDelete(req, res) {
        try { await service.delete(req.params.id); req.flash('success_msg', 'Xóa thành công'); res.redirect('/admin/danh-muc-noi-that'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
    async processBulkDelete(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids]; await service.bulkDelete(ids); req.flash('success_msg', `Đã xóa ${ids.length} mục`); res.redirect('/admin/danh-muc-noi-that'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
    async apiToggleStatus(req, res) { try { const newStatus = await service.toggleStatus(req.params.id); res.json({ success: true, newStatus }); } catch (err) { res.json({ success: false, message: err.message }); } }
    async processBulkStatus(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids]; await service.bulkUpdateStatus(ids, req.body.status); req.flash('success_msg', 'Cập nhật trạng thái thành công'); res.redirect('/admin/danh-muc-noi-that'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/danh-muc-noi-that'); }
    }
}
module.exports = new DanhMucNoiThatController();