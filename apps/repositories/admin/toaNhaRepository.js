const { ToaNha, Tang } = require('../../models');
const { Op } = require('sequelize');

class ToaNhaRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenToaNha = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await ToaNha.findAndCountAll({ where, limit, offset, order: [['MaToaNha', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) {
        return await ToaNha.findAll({ where: { TenToaNha: { [Op.like]: `%${q}%` } }, attributes: ['MaToaNha', 'TenToaNha'], limit });
    }
    async getAllActive() { return await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha', 'ASC']] }); }
    async getAll() { return await ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }); }
    async getById(id, includeTang = false) {
        return await ToaNha.findByPk(id, includeTang ? { include: [{ model: Tang }] } : undefined);
    }
    async create(data) { return await ToaNha.create(data); }
    async deleteById(id) { return await ToaNha.destroy({ where: { MaToaNha: id } }); }
    async deleteByIds(ids) { return await ToaNha.destroy({ where: { MaToaNha: ids } }); }
    async updateStatusBatch(ids, status) { return await ToaNha.update({ TTHienThi: status }, { where: { MaToaNha: ids } }); }
}
module.exports = new ToaNhaRepository();