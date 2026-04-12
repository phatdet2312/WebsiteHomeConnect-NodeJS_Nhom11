const service = require('../../services/admin/toaNhaService');
const { ToaNhaDTO } = require('../../dtos/admin/infrastructure.dto');

class ToaNhaController {
    async renderList(req, res) {
        try {
            const { search, status, page = 1 } = req.query;
            const data = await service.getList(search, status, +page, 10);
            res.render('admin/toaNha/index', { title: 'Quản lý Tòa nhà', layout: 'layouts/admin', items: data.items, totalItems: data.totalItems, search: search || '', status: status || '', currentPage: +page, totalPages: data.totalPages });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/dashboard'); }
    }
    async apiSearchSuggestions(req, res) {
        try { const q = req.query.q || ''; if (!q) return res.json([]); res.json(await service.getSearchSuggestions(q)); } catch (err) { res.json([]); }
    }
    renderAddForm(req, res) { res.render('admin/toaNha/add', { title: 'Thêm Tòa nhà', layout: 'layouts/admin', item: null, errors: [] }); }
    async processAdd(req, res) {
        try {
            const dto = new ToaNhaDTO(req.body);
            await service.create(dto);
            req.flash('success_msg', 'Thêm tòa nhà thành công');
            res.redirect('/admin/toa-nha');
        } catch (err) { res.render('admin/toaNha/add', { title: 'Thêm Tòa nhà', layout: 'layouts/admin', item: req.body, errors: [err.message] }); }
    }
    async renderDisplay(req, res) {
        try {
            const item = await service.getDetail(req.params.id, true);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tòa nhà'); return res.redirect('/admin/toa-nha'); }
            res.render('admin/toaNha/display', { title: 'Chi tiết Tòa nhà', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
    }
    async renderUpdateForm(req, res) {
        try {
            const item = await service.getDetail(req.params.id, false);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tòa nhà'); return res.redirect('/admin/toa-nha'); }
            res.render('admin/toaNha/update', { title: 'Cập nhật Tòa nhà', layout: 'layouts/admin', item, errors: [] });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
    }
    async processUpdate(req, res) {
        try {
            const dto = new ToaNhaDTO(req.body);
            await service.update(req.params.id, dto);
            req.flash('success_msg', 'Cập nhật tòa nhà thành công');
            res.redirect('/admin/toa-nha');
        } catch (err) {
            const item = await service.getDetail(req.params.id, false).catch(() => null);
            res.render('admin/toaNha/update', { title: 'Cập nhật Tòa nhà', layout: 'layouts/admin', item: item || req.body, errors: [err.message] });
        }
    }
    async renderDeleteConfirm(req, res) {
        try {
            const item = await service.getDetail(req.params.id, false);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tòa nhà'); return res.redirect('/admin/toa-nha'); }
            res.render('admin/toaNha/delete', { title: 'Xóa Tòa nhà', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
    }
    async processDelete(req, res) {
        try { await service.delete(req.params.id); req.flash('success_msg', 'Xóa tòa nhà thành công'); res.redirect('/admin/toa-nha'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
    }
    async processBulkDelete(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await service.bulkDelete(ids);
            req.flash('success_msg', `Đã xóa ${ids.length} tòa nhà`);
            res.redirect('/admin/toa-nha');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
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
            res.redirect('/admin/toa-nha');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/toa-nha'); }
    }
}
module.exports = new ToaNhaController();