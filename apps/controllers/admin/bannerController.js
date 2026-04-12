const service = require('../../services/admin/bannerService');
const { BannerDTO } = require('../../dtos/admin/banner.dto');

class BannerController {
    async renderList(req, res) {
        try {
            const { search, status, page = 1 } = req.query;
            const data = await service.getListBanners(search, status, +page, 10);
            
            res.render('admin/banner/index', {
                title: 'Quản lý Banner', layout: 'layouts/admin',
                items: data.items, totalItems: data.totalItems, search: search || '', status: status || '',
                currentPage: +page, totalPages: data.totalPages
            });
        } catch (err) {
            req.flash('error_msg', err.message);
            res.redirect('/admin/dashboard');
        }
    }

    async apiSearchSuggestions(req, res) {
        try {
            const q = req.query.q || '';
            if (!q) return res.json([]);
            res.json(await service.getSearchSuggestions(q));
        } catch (err) { res.json([]); }
    }

    renderAddForm(req, res) {
        res.render('admin/banner/add', { title: 'Thêm Banner', layout: 'layouts/admin', item: null, errors: [] });
    }

    async processAdd(req, res) {
        try {
            const dto = new BannerDTO(req.body);
            await service.createBanner(dto, req.file);
            req.flash('success_msg', 'Thêm banner thành công');
            res.redirect('/admin/banner');
        } catch (err) {
            res.render('admin/banner/add', { title: 'Thêm Banner', layout: 'layouts/admin', item: req.body, errors: [err.message] });
        }
    }

    async renderDisplay(req, res) {
        try {
            const item = await service.getBannerDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy banner'); return res.redirect('/admin/banner'); }
            res.render('admin/banner/display', { title: 'Chi tiết Banner', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }

    async renderUpdateForm(req, res) {
        try {
            const item = await service.getBannerDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy banner'); return res.redirect('/admin/banner'); }
            res.render('admin/banner/update', { title: 'Cập nhật Banner', layout: 'layouts/admin', item, errors: [] });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }

    async processUpdate(req, res) {
        try {
            const dto = new BannerDTO(req.body);
            await service.updateBanner(req.params.id, dto, req.file);
            req.flash('success_msg', 'Cập nhật banner thành công');
            res.redirect('/admin/banner');
        } catch (err) {
            const item = await service.getBannerDetail(req.params.id).catch(() => null);
            res.render('admin/banner/update', { title: 'Cập nhật Banner', layout: 'layouts/admin', item: item || req.body, errors: [err.message] });
        }
    }

    async renderDeleteConfirm(req, res) {
        try {
            const item = await service.getBannerDetail(req.params.id);
            if (!item) { req.flash('error_msg', 'Không tìm thấy banner'); return res.redirect('/admin/banner'); }
            res.render('admin/banner/delete', { title: 'Xóa Banner', layout: 'layouts/admin', item });
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }

    async processDelete(req, res) {
        try {
            await service.deleteBanner(req.params.id);
            req.flash('success_msg', 'Xóa banner thành công');
            res.redirect('/admin/banner');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }

    async processBulkDelete(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await service.bulkDeleteBanners(ids);
            req.flash('success_msg', `Đã xóa ${ids.length} banner`);
            res.redirect('/admin/banner');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }

    async apiToggleStatus(req, res) {
        try {
            const newStatus = await service.toggleStatus(req.params.id);
            res.json({ success: true, newStatus });
        } catch (err) { res.json({ success: false, message: err.message }); }
    }

    async processBulkStatus(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
            await service.bulkUpdateStatus(ids, req.body.status);
            req.flash('success_msg', 'Cập nhật trạng thái thành công');
            res.redirect('/admin/banner');
        } catch (err) { req.flash('error_msg', err.message); res.redirect('/admin/banner'); }
    }
}
module.exports = new BannerController();