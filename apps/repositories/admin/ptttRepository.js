const { PTTT } = require('../../models');
const { Op } = require('sequelize');

class PtttRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenPT = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await PTTT.findAndCountAll({ where, limit, offset, order: [['MaPT', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) { return await PTTT.findAll({ where: { TenPT: { [Op.like]: `%${q}%` } }, attributes: ['MaPT', 'TenPT'], limit }); }
    async getById(id) { return await PTTT.findByPk(id); }
    async getByIds(ids) { return await PTTT.findAll({ where: { MaPT: ids } }); }
    async create(data) { return await PTTT.create(data); }
    async deleteById(id) { return await PTTT.destroy({ where: { MaPT: id } }); }
    async deleteByIds(ids) { return await PTTT.destroy({ where: { MaPT: ids } }); }
    async updateStatusBatch(ids, status) { return await PTTT.update({ TTHienThi: status }, { where: { MaPT: ids } }); }
}
module.exports = new PtttRepository();