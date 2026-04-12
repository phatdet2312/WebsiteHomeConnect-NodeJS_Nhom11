const { DanhMucNoiThat } = require('../../models');
const { Op } = require('sequelize');

class DanhMucNoiThatRepository {
    async getPaginated(search, status, limit, offset) {
        const where = {};
        if (search) where.TenDMNT = { [Op.like]: `%${search}%` };
        if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
        return await DanhMucNoiThat.findAndCountAll({ where, limit, offset, order: [['MaDMNT', 'DESC']] });
    }
    async searchSuggestions(q, limit = 10) { return await DanhMucNoiThat.findAll({ where: { TenDMNT: { [Op.like]: `%${q}%` } }, attributes: ['MaDMNT', 'TenDMNT'], limit }); }
    async getById(id) { return await DanhMucNoiThat.findByPk(id); }
    async create(data) { return await DanhMucNoiThat.create(data); }
    async deleteById(id) { return await DanhMucNoiThat.destroy({ where: { MaDMNT: id } }); }
    async deleteByIds(ids) { return await DanhMucNoiThat.destroy({ where: { MaDMNT: ids } }); }
    async updateStatusBatch(ids, status) { return await DanhMucNoiThat.update({ TTHienThi: status }, { where: { MaDMNT: ids } }); }
}
module.exports = new DanhMucNoiThatRepository();