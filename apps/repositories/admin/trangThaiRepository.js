const { TrangThai } = require('../../models');
const { Op } = require('sequelize');

class TrangThaiRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenTT = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await TrangThai.findAndCountAll({ where, limit, offset, order: [['MaTT', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) { return await TrangThai.findAll({ where: { TenTT: { [Op.like]: `%${q}%` } }, attributes: ['MaTT', 'TenTT'], limit }); }
    async getById(id) { return await TrangThai.findByPk(id); }
    async getByIds(ids) { return await TrangThai.findAll({ where: { MaTT: ids } }); }
    async create(data) { return await TrangThai.create(data); }
    async deleteById(id) { return await TrangThai.destroy({ where: { MaTT: id } }); }
    async deleteByIds(ids) { return await TrangThai.destroy({ where: { MaTT: ids } }); }
    async updateStatusBatch(ids, status) { return await TrangThai.update({ TTHienThi: status }, { where: { MaTT: ids } }); }
}
module.exports = new TrangThaiRepository();