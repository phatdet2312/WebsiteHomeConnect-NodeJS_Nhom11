const repo = require('../../repositories/admin/toaNhaRepository');

class ToaNhaService {
    async getList(search, status, page, limit) {
        const offset = (page - 1) * limit;
        const result = await repo.getPaginated(search, status, limit, offset);
        return { items: result.rows, totalItems: result.count, totalPages: Math.ceil(result.count / limit) };
    }
    async getSearchSuggestions(query) { return await repo.searchSuggestions(query); }
    async getDetail(id, includeTang) { return await repo.getById(id, includeTang); }
    async getAll() { return await repo.getAll(); }
    async getAllActive() { return await repo.getAllActive(); }
    
    async create(dto) {
        const err = dto.validate();
        if (err) throw new Error(err);
        return await repo.create(dto);
    }
    async update(id, dto) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy tòa nhà');
        const err = dto.validate();
        if (err) throw new Error(err);
        return await item.update(dto);
    }
    async delete(id) { await repo.deleteById(id); }
    async bulkDelete(ids) { await repo.deleteByIds(ids); }
    async toggleStatus(id) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy tòa nhà');
        await item.update({ TTHienThi: !item.TTHienThi });
        return item.TTHienThi;
    }
    async bulkUpdateStatus(ids, status) { await repo.updateStatusBatch(ids, status === 'true'); }
}
module.exports = new ToaNhaService();