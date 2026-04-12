const canHoService = require('../services/canHoService');

class ChiTietCanHoController {
    renderIndex(req, res) {
        res.render('chiTietCanHo/index', { title: 'Chi tiết căn hộ - HomeConnect', layout: 'layouts/main' });
    }

    async apiGetDetail(req, res) {
        try {
            const canHo = await canHoService.getCanHoDetail(req.params.id);
            if (!canHo) return res.status(404).json({ error: 'Không tìm thấy' });
            res.json(canHo);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
module.exports = new ChiTietCanHoController();