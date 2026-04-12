const service = require('../services/canHoKhachHangService');

class CanHoKhachHangController {
    renderIndex(req, res) { res.render('canho/index', { title: 'Căn hộ của tôi', layout: 'layouts/main' }); }
    renderChiTiet(req, res) { res.render('canho/chiTiet', { title: 'Chi tiết hợp đồng', layout: 'layouts/main' }); }

    async apiGetMyContracts(req, res) {
        try { res.json(await service.getMyContracts(req.user.dataValues.KhachHang.MaKH)); }
        catch (err) { res.status(500).json({ error: err.message }); }
    }

    async apiGetContractDetail(req, res) {
        try {
            const data = await service.getContractDetail(req.params.id, req.user.dataValues.KhachHang.MaKH);
            if (!data) return res.status(404).json({ error: 'Không tìm thấy' });
            res.json(data);
        } catch (err) { res.status(500).json({ error: err.message }); }
    }
}
module.exports = new CanHoKhachHangController();