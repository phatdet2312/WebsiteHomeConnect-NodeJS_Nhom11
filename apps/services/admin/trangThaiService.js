const repo = require('../../repositories/admin/trangThaiRepository');
const fs = require('fs');
const path = require('path');

class TrangThaiService {
    _deleteFile(url) { if (url) { const p = path.join(__dirname, '../../../../public', url); if (fs.existsSync(p)) fs.unlinkSync(p); } }

    async getList(search, status, page, limit) {
        const offset = (page - 1) * limit;
        const result = await repo.getPaginated(search, status, limit, offset);
        return { items: result.rows, totalItems: result.count, totalPages: Math.ceil(result.count / limit) };
    }
    async getSearchSuggestions(query) { return await repo.searchSuggestions(query); }
    async getDetail(id) { return await repo.getById(id); }
    
    async create(dto, file) {
        const err = dto.validate(); if (err) throw new Error(err);
        const UrlAnh = file ? '/images/TrangThai/' + file.filename : null;
        return await repo.create({ ...dto, UrlAnh });
    }
    async update(id, dto, file) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy');
        const err = dto.validate(); if (err) throw new Error(err);
        let UrlAnh = item.UrlAnh;
        if (file) { this._deleteFile(item.UrlAnh); UrlAnh = '/images/TrangThai/' + file.filename; }
        return await item.update({ ...dto, UrlAnh });
    }
    async delete(id) { const item = await repo.getById(id); if (item) { this._deleteFile(item.UrlAnh); await repo.deleteById(id); } }
    async bulkDelete(ids) { const items = await repo.getByIds(ids); for (const item of items) { this._deleteFile(item.UrlAnh); } await repo.deleteByIds(ids); }
    async toggleStatus(id) { const item = await repo.getById(id); if (item) { await item.update({ TTHienThi: !item.TTHienThi }); return item.TTHienThi; } }
    async bulkUpdateStatus(ids, status) { await repo.updateStatusBatch(ids, status === 'true'); }
}
module.exports = new TrangThaiService();