const { BannerQuangCao } = require('../../models');
const { Op } = require('sequelize');

class BannerRepository {
    async getPaginatedBanners(search, status, limit, offset) {
        const where = {};
        if (search) where.MoTa = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';

        return await BannerQuangCao.findAndCountAll({
            where, limit, offset, order: [['MaAQC', 'DESC']]
        });
    }

    async searchSuggestions(query, limit = 10) {
        return await BannerQuangCao.findAll({
            where: { MoTa: { [Op.like]: `%${query}%` } },
            attributes: ['MaAQC', 'MoTa'], limit
        });
    }

    async getById(id) { return await BannerQuangCao.findByPk(id); }
    async getByIds(ids) { return await BannerQuangCao.findAll({ where: { MaAQC: ids } }); }
    async create(data) { return await BannerQuangCao.create(data); }

    async deleteById(id) { return await BannerQuangCao.destroy({ where: { MaAQC: id } }); }
    async deleteByIds(ids) { return await BannerQuangCao.destroy({ where: { MaAQC: ids } }); }
    async updateStatusBatch(ids, status) {
        return await BannerQuangCao.update({ TTHienThi: status }, { where: { MaAQC: ids } });
    }
}
module.exports = new BannerRepository();