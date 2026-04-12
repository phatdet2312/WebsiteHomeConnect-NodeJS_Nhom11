const service = require('../../services/admin/dichVuService');
const { DichVuDTO } = require('../../dtos/admin/serviceContract.dto');

class DichVuController {
    renderIndex(req, res) { res.render('admin/dichVu/index', { title: 'Quản lý Dịch vụ', layout: 'layouts/admin' }); }
    renderAdd(req, res) { res.render('admin/dichVu/add', { title: 'Thêm Dịch vụ', layout: 'layouts/admin' }); }
    renderUpdate(req, res) { res.render('admin/dichVu/update', { title: 'Cập nhật Dịch vụ', layout: 'layouts/admin', id: req.params.id }); }
    renderDisplay(req, res) { res.render('admin/dichVu/display', { title: 'Chi tiết Dịch vụ', layout: 'layouts/admin', id: req.params.id }); }

    async apiGetList(req, res) {
        try { res.json({ success: true, ...await service.getList(req.query) }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiGetSuggestions(req, res) {
        try { res.json({ success: true, data: await service.getSuggestions(req.query.term, req.query.status) }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiGetDetail(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.json({ success: true, data: item });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiCreate(req, res) {
        try { await service.create(new DichVuDTO(req.body), req.file); res.json({ success: true, message: 'Thêm thành công!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiUpdate(req, res) {
        try { await service.update(req.params.id, new DichVuDTO(req.body), req.file); res.json({ success: true, message: 'Cập nhật thành công!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiDelete(req, res) {
        try { await service.delete(req.params.id); res.json({ success: true, message: 'Xóa thành công!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiChangeStatus(req, res) {
        try { await service.toggleStatus(req.params.id, req.body.status); res.json({ success: true, message: 'Cập nhật trạng thái thành công' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiDeleteMultiple(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []); await service.bulkDelete(ids); res.json({ success: true, message: 'Đã xóa' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiUpdateStatusBatch(req, res) {
        try { const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []); await service.bulkUpdateStatus(ids, req.body.status); res.json({ success: true, message: 'Đã cập nhật' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new DichVuController();