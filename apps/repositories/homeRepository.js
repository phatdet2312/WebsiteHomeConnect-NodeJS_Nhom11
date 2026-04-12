const { BannerQuangCao, DichVu } = require('../models');

class HomeRepository {
    async getActiveBanners(limit = null) {
        const query = { where: { TTHienThi: true }, order: [['MaAQC', 'DESC']] };
        if (limit) query.limit = limit;
        return await BannerQuangCao.findAll(query);
    }

    async getActiveDichVus(limit = null) {
        const query = { where: { TTHienThi: true } };
        if (limit) query.limit = limit;
        return await DichVu.findAll(query);
    }
}
module.exports = new HomeRepository();