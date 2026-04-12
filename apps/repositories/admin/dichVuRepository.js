const { DichVu } = require('../../models');

class DichVuRepository {
    async getAll() { return await DichVu.findAll({ order: [['MaDV', 'DESC']] }); }
    async getById(id) { return await DichVu.findByPk(id); }
    async getByIds(ids) { return await DichVu.findAll({ where: { MaDV: ids } }); }
    async create(data) { return await DichVu.create(data); }
    async deleteById(id) { return await DichVu.destroy({ where: { MaDV: id } }); }
    async updateStatusBatch(ids, status) { return await DichVu.update({ TTHienThi: status }, { where: { MaDV: ids } }); }
}
module.exports = new DichVuRepository();