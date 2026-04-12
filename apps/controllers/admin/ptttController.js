const service = require('../../services/admin/ptttService');
const { PTTTDTO } = require('../../dtos/admin/system.dto');

class PtttController {
    async renderList(req, res) {
        try {
            const { search, status, page = 1 } = req.query;
            const data = await service.getList(search, status, +page, 10);
            res.render('admin/pttt/index', { title: 'Quản lý PTTT', layout: 'layouts/admin', items: data.items, totalItems: data.totalItems, search: search || '', status: status || '', currentPage: +page, totalPages: data.totalPages });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/dashboard'); }
    }
    async apiSearchSuggestions(req, res) { try { const q = req.query.q || ''; if (!q) return res.json([]); res.json(await service.getSearchSuggestions(q)); } catch (err) { res.json([]); } }
    renderAddForm(req, res) { res.render('admin/pttt/add', { title: 'Thêm PTTT', layout: 'layouts/admin', item: null, errors: [] }); }
    async processAdd(req, res) {
        try { const dto = new PTTTDTO(req.body); await service.create(dto); req.flash('success_msg', 'Thêm thành công'); res.redirect('/admin/pttt'); } 
        catch (err) { res.render('admin/pttt/add', { title: 'Thêm PTTT', layout: 'layouts/admin', item: req.body, errors: [err.message] }); }
    }
    async renderDisplay(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/pttt'); } res.render('admin/pttt/display', { title: 'Chi tiết PTTT', layout: 'layouts/admin', item }); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
    async renderUpdateForm(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/pttt'); } res.render('admin/pttt/update', { title: 'Cập nhật PTTT', layout: 'layouts/admin', item, errors: [] }); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
    async processUpdate(req, res) {
        try { const dto = new PTTTDTO(req.body); await service.update(req.params.id, dto); req.flash('success_msg', 'Cập nhật thành công'); res.redirect('/admin/pttt'); } 
        catch (err) { const item = await service.getDetail(req.params.id).catch(() => null); res.render('admin/pttt/update', { title: 'Cập nhật PTTT', layout: 'layouts/admin', item: item || req.body, errors: [err.message] }); }
    }
    async renderDeleteConfirm(req, res) {
        try { const item = await service.getDetail(req.params.id); if (!item) { req.flash('error_msg', 'Không tìm thấy'); return res.redirect('/admin/pttt'); } res.render('admin/pttt/delete', { title: 'Xóa PTTT', layout: 'layouts/admin', item }); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
    async processDelete(req, res) {
        try { await service.delete(req.params.id); req.flash('success_msg', 'Xóa thành công'); res.redirect('/admin/pttt'); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
    async processBulkDelete(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids]; await service.bulkDelete(ids); req.flash('success_msg', `Đã xóa ${ids.length} mục`); res.redirect('/admin/pttt'); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
    async apiToggleStatus(req, res) { try { const newStatus = await service.toggleStatus(req.params.id); res.json({ success: true, newStatus }); } catch (err) { res.json({ success: false, message: err.message }); } }
    async processBulkStatus(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids]; await service.bulkUpdateStatus(ids, req.body.status); req.flash('success_msg', 'Cập nhật trạng thái thành công'); res.redirect('/admin/pttt'); } 
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/pttt'); }
    }
}
module.exports = new PtttController();