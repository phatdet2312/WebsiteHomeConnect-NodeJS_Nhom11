const repo = require('../../repositories/admin/tangRepository');

class TangService {
    async getList(search, status, maToaNha, page, limit) {
        const offset = (page - 1) * limit;
        const result = await repo.getPaginated(search, status, maToaNha, limit, offset);
        const items = result.rows.map(r => ({ ...r.toJSON(), TenToaNha: r.ToaNha ? r.ToaNha.TenToaNha : '—' }));
        return { items, totalItems: result.count, totalPages: Math.ceil(result.count / limit) };
    }
    async getSearchSuggestions(query) { return await repo.searchSuggestions(query); }
    async getDetail(id, includeToaNha) { return await repo.getById(id, includeToaNha); }
    
    async create(dto) {
        const err = dto.validate();
        if (err) throw new Error(err);
        return await repo.create(dto);
    }
    async update(id, dto) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy tầng');
        const err = dto.validate();
        if (err) throw new Error(err);
        return await item.update(dto);
    }
    async delete(id) { await repo.deleteById(id); }
    async bulkDelete(ids) { await repo.deleteByIds(ids); }
    async toggleStatus(id) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy tầng');
        await item.update({ TTHienThi: !item.TTHienThi });
        return item.TTHienThi;
    }
    async bulkUpdateStatus(ids, status) { await repo.updateStatusBatch(ids, status === 'true'); }
}
module.exports = new TangService();