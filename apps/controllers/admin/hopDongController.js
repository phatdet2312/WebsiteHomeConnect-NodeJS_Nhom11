// apps/controllers/admin/hopDongController.js
const service = require('../../services/admin/hopDongService');
const { HopDongDTO } = require('../../dtos/admin/serviceContract.dto');

class HopDongController {
    renderIndex(req, res) { res.render('admin/hopDong/index', { title: 'Quản lý Hợp đồng', layout: 'layouts/admin' }); }
    renderAdd(req, res) { res.render('admin/hopDong/add', { title: 'Thêm Hợp đồng', layout: 'layouts/admin' }); }
    renderUpdate(req, res) { res.render('admin/hopDong/update', { title: 'Sửa Hợp đồng', layout: 'layouts/admin', id: req.params.id }); }
    renderDisplay(req, res) { res.render('admin/hopDong/display', { title: 'Chi tiết', layout: 'layouts/admin', id: req.params.id }); }

    async apiGetFormData(req, res) {
        try { res.json({ success: true, data: await service.getMasterData() }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiGetList(req, res) {
        try { res.json({ success: true, ...await service.getList(req.query) }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiGetSuggestions(req, res) {
        try { res.json({ success: true, data: await service.getSuggestions(req.query.term) }); } 
        catch (err) { res.status(500).json({ success: false }); }
    }
    async apiGetDetail(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
            res.json({ success: true, data: item });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiCreate(req, res) {
        try {
            const dto = new HopDongDTO(req.body);
            const id = await service.create(dto, req.files);
            res.json({ success: true, message: 'Tạo hợp đồng thành công', id: id });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiUpdate(req, res) {
        try {
            const dto = new HopDongDTO(req.body);
            await service.update(req.params.id, dto, req.files);
            res.json({ success: true, message: 'Cập nhật thành công' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiDeleteMultiple(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
            if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn hợp đồng' });
            await service.deleteMultiple(ids);
            res.json({ success: true, message: `Đã xóa ${ids.length} hợp đồng` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiChangeStatus(req, res) {
        try { await service.toggleStatus(req.params.id, req.body.status); res.json({ success: true, message: 'Đổi trạng thái thành công' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
    async apiUpdateStatusBatch(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
            if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn' });
            await service.bulkUpdateStatus(ids, req.body.status);
            res.json({ success: true, message: `Đã cập nhật trạng thái cho ${ids.length} hợp đồng` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new HopDongController();