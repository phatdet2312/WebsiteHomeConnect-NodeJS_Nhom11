const tangService = require('../../services/admin/tangService');
const toaNhaService = require('../../services/admin/toaNhaService');
const { TangDTO } = require('../../dtos/admin/infrastructure.dto');

class TangController {
    async renderList(req, res) {
        try {
            const { search, status, maToaNha, page = 1 } = req.query;
            const data = await tangService.getList(search, status, maToaNha, +page, 10);
            const toaNhaList = await toaNhaService.getAll();
            res.render('admin/tang/index', { title: 'Quản lý Tầng', layout: 'layouts/admin', items: data.items, totalItems: data.totalItems, search: search || '', status: status || '', maToaNha: maToaNha || '', toaNhaList, currentPage: +page, totalPages: data.totalPages });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/dashboard'); }
    }
    async apiSearchSuggestions(req, res) {
        try { const q = req.query.q || ''; if (!q) return res.json([]); res.json(await tangService.getSearchSuggestions(q)); } catch (err) { res.json([]); }
    }
    async renderAddForm(req, res) {
        try {
            const toaNhaList = await toaNhaService.getAllActive();
            res.render('admin/tang/add', { title: 'Thêm Tầng', layout: 'layouts/admin', item: null, toaNhaList, errors: [] });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async processAdd(req, res) {
        try {
            const dto = new TangDTO(req.body);
            await tangService.create(dto);
            req.flash('success_msg', 'Thêm tầng thành công');
            res.redirect('/admin/tang');
        } catch (err) {
            const toaNhaList = await toaNhaService.getAll().catch(() => []);
            res.render('admin/tang/add', { title: 'Thêm Tầng', layout: 'layouts/admin', item: req.body, toaNhaList, errors: [err.message] });
        }
    }
    async renderDisplay(req, res) {
        try {
            const item = await tangService.getDetail(req.params.id, true);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tầng'); return res.redirect('/admin/tang'); }
            res.render('admin/tang/display', { title: 'Chi tiết Tầng', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async renderUpdateForm(req, res) {
        try {
            const item = await tangService.getDetail(req.params.id, false);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tầng'); return res.redirect('/admin/tang'); }
            const toaNhaList = await toaNhaService.getAll();
            res.render('admin/tang/update', { title: 'Cập nhật Tầng', layout: 'layouts/admin', item, toaNhaList, errors: [] });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async processUpdate(req, res) {
        try {
            const dto = new TangDTO(req.body);
            await tangService.update(req.params.id, dto);
            req.flash('success_msg', 'Cập nhật tầng thành công');
            res.redirect('/admin/tang');
        } catch (err) {
            const item = await tangService.getDetail(req.params.id, false).catch(() => null);
            const toaNhaList = await toaNhaService.getAll().catch(() => []);
            res.render('admin/tang/update', { title: 'Cập nhật Tầng', layout: 'layouts/admin', item: item || req.body, toaNhaList, errors: [err.message] });
        }
    }
    async renderDeleteConfirm(req, res) {
        try {
            const item = await tangService.getDetail(req.params.id, true);
            if (!item) { req.flash('error_msg', 'Không tìm thấy tầng'); return res.redirect('/admin/tang'); }
            res.render('admin/tang/delete', { title: 'Xóa Tầng', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async processDelete(req, res) {
        try { await tangService.delete(req.params.id); req.flash('success_msg', 'Xóa tầng thành công'); res.redirect('/admin/tang'); }
        catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async processBulkDelete(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await tangService.bulkDelete(ids);
            req.flash('success_msg', `Đã xóa ${ids.length} tầng`);
            res.redirect('/admin/tang');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
    async apiToggleStatus(req, res) {
        try { const newStatus = await tangService.toggleStatus(req.params.id); res.json({ success: true, newStatus }); }
        catch (err) { res.json({ success: false, message: err.message }); }
    }
    async processBulkStatus(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await tangService.bulkUpdateStatus(ids, req.body.status);
            req.flash('success_msg', 'Cập nhật trạng thái thành công');
            res.redirect('/admin/tang');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/tang'); }
    }
}
module.exports = new TangController();