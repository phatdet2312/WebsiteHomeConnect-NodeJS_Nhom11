const { LoaiTTHD } = require('../../models');
const { Op } = require('sequelize');

class LoaiTTHDRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenLoaiTT = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await LoaiTTHD.findAndCountAll({ where, limit, offset, order: [['MaLoaiTT', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) { return await LoaiTTHD.findAll({ where: { TenLoaiTT: { [Op.like]: `%${q}%` } }, attributes: ['MaLoaiTT', 'TenLoaiTT'], limit }); }
    async getById(id) { return await LoaiTTHD.findByPk(id); }
    async getByIds(ids) { return await LoaiTTHD.findAll({ where: { MaLoaiTT: ids } }); }
    async create(data) { return await LoaiTTHD.create(data); }
    async deleteById(id) { return await LoaiTTHD.destroy({ where: { MaLoaiTT: id } }); }
    async deleteByIds(ids) { return await LoaiTTHD.destroy({ where: { MaLoaiTT: ids } }); }
    async updateStatusBatch(ids, status) { return await LoaiTTHD.update({ TTHienThi: status }, { where: { MaLoaiTT: ids } }); }
}
module.exports = new LoaiTTHDRepository();