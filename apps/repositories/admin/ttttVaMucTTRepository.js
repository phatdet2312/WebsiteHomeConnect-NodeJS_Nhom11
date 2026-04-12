const { TTTTvaMucTT } = require('../../models');
const { Op } = require('sequelize');

class TTTTvaMucTTRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.Ten = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await TTTTvaMucTT.findAndCountAll({ where, limit, offset, order: [['MaMucTT', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) { return await TTTTvaMucTT.findAll({ where: { Ten: { [Op.like]: `%${q}%` } }, attributes: ['MaMucTT', 'Ten'], limit }); }
    async getById(id) { return await TTTTvaMucTT.findByPk(id); }
    async create(data) { return await TTTTvaMucTT.create(data); }
    async deleteById(id) { return await TTTTvaMucTT.destroy({ where: { MaMucTT: id } }); }
    async deleteByIds(ids) { return await TTTTvaMucTT.destroy({ where: { MaMucTT: ids } }); }
    async updateStatusBatch(ids, status) { return await TTTTvaMucTT.update({ TTHienThi: status }, { where: { MaMucTT: ids } }); }
}
module.exports = new TTTTvaMucTTRepository();