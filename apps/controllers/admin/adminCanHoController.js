const service = require('../../services/admin/adminCanHoService');
const { CanHoDTO } = require('../../dtos/admin/apartment.dto');

class AdminCanHoController {
    renderIndex(req, res) { res.render('admin/canho/index', { title: 'Quản lý Căn hộ', layout: 'layouts/admin' }); }
    renderAdd(req, res) { res.render('admin/canho/add', { title: 'Thêm Căn hộ', layout: 'layouts/admin' }); }
    renderUpdate(req, res) { res.render('admin/canho/update', { title: 'Cập nhật Căn hộ', layout: 'layouts/admin', id: req.params.id }); }
    renderDisplay(req, res) { res.render('admin/canho/display', { title: 'Chi tiết Căn hộ', layout: 'layouts/admin', id: req.params.id }); }

    async apiGetMetadata(req, res) {
        try {
            const [toaNhas, tangs, hienTrangs, mucTTs] = await service.getMetadata();
            res.json({
                success: true,
                toaNhas: toaNhas.map(t => ({ maToaNha: t.MaToaNha, tenToaNha: t.TenToaNha })),
                tangs: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang, maToaNha: t.MaToaNha, tenToaNha: t.ToaNha?.TenToaNha })),
                hienTrangs: hienTrangs.map(h => ({ maHT: h.MaHienTrang, tenHT: h.TenHienTrang, mucDo: h.MucDo })),
                mucTTs: mucTTs.map(m => ({ maMucTT: m.MaMucTT, ten: m.Ten, mucDo: m.MucDo }))
            });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiGetList(req, res) {
        try {
            const data = await service.getList(req.query);
            res.json({ success: true, data: data.data, totalItems: data.totalItems, totalPages: data.totalPages, currentPage: parseInt(req.query.page || 1), message: data.message, suggestions: data.suggestions });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiGetSuggestions(req, res) {
        try { res.json({ success: true, data: await service.getSuggestions(req.query.term) }); }
        catch (err) { res.json({ success: false, data: [] }); }
    }

    async apiGetDetail(req, res) {
        try {
            const item = await service.getDetail(req.params.id);
            if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy căn hộ' });
            res.json({ success: true, data: item });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiCreate(req, res) {
        try {
            const dto = new CanHoDTO(req.body);
            const id = await service.create(dto, req.files || []);
            res.json({ success: true, message: 'Thêm căn hộ thành công!', id: id });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiUpdate(req, res) {
        try {
            const dto = new CanHoDTO(req.body);
            await service.update(req.params.id, dto, req.files || []);
            res.json({ success: true, message: 'Cập nhật thành công!' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiDeleteMultiple(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
            if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });
            await service.deleteMultiple(ids);
            res.json({ success: true, message: `Đã xóa ${ids.length} căn hộ` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiChangeStatus(req, res) {
        try {
            await service.toggleStatus(req.params.id, req.body.type, req.body.status);
            res.json({ success: true, message: 'Cập nhật thành công' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiBulkUpdate(req, res) {
        try {
            const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
            if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });
            await service.bulkUpdate(ids, req.body.type, req.body.value);
            res.json({ success: true, message: `Đã cập nhật hàng loạt cho ${ids.length} căn hộ.` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new AdminCanHoController();