const { HienTrang } = require('../../models');
const { Op } = require('sequelize');

class HienTrangRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenHienTrang = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await HienTrang.findAndCountAll({ where, limit, offset, order: [['MaHienTrang', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) {
        return await HienTrang.findAll({ where: { TenHienTrang: { [Op.like]: `%${q}%` } }, attributes: ['MaHienTrang', 'TenHienTrang'], limit });
    }
    async getById(id) { return await HienTrang.findByPk(id); }
    async create(data) { return await HienTrang.create(data); }
    async deleteById(id) { return await HienTrang.destroy({ where: { MaHienTrang: id } }); }
    async deleteByIds(ids) { return await HienTrang.destroy({ where: { MaHienTrang: ids } }); }
    async updateStatusBatch(ids, status) { return await HienTrang.update({ TTHienThi: status }, { where: { MaHienTrang: ids } }); }
}
module.exports = new HienTrangRepository();