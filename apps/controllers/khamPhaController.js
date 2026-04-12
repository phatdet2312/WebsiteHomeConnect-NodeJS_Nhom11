const canHoService = require('../services/canHoService');
const { KhamPhaFilterDTO } = require('../dtos/public.dto');

class KhamPhaController {
    renderIndex(req, res) {
        res.render('khamPha/index', { title: 'Khám phá căn hộ - HomeConnect', layout: 'layouts/main' });
    }

    async apiGetList(req, res) {
        try {
            const dto = new KhamPhaFilterDTO(req.query);
            const data = await canHoService.getListKhamPha(dto);
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}
module.exports = new KhamPhaController();