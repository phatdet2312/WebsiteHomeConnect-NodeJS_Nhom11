const { Tang, ToaNha } = require('../../models');
const { Op } = require('sequelize');

class TangRepository {
    async getPaginated(search, status, maToaNha, limit, offset) {
        const where = {};
        if (search) where.TenTang = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        if (maToaNha && maToaNha !== '') where.MaToaNha = parseInt(maToaNha);
        return await Tang.findAndCountAll({
            where, limit, offset, order: [['MaTang', 'DESC']],
            include: [{ model: ToaNha, attributes: ['MaToaNha', 'TenToaNha'] }]
        });
    }
    async searchSuggestions(q, limit = 10) {
        return await Tang.findAll({ where: { TenTang: { [Op.like]: `%${q}%` } }, attributes: ['MaTang', 'TenTang'], limit });
    }
    async getById(id, includeToaNha = false) {
        return await Tang.findByPk(id, includeToaNha ? { include: [{ model: ToaNha, attributes: ['TenToaNha'] }] } : undefined);
    }
    async create(data) { return await Tang.create(data); }
    async deleteById(id) { return await Tang.destroy({ where: { MaTang: id } }); }
    async deleteByIds(ids) { return await Tang.destroy({ where: { MaTang: ids } }); }
    async updateStatusBatch(ids, status) { return await Tang.update({ TTHienThi: status }, { where: { MaTang: ids } }); }
}
module.exports = new TangRepository();