const repo = require('../../repositories/admin/dichVuRepository');
const fs = require('fs');
const path = require('path');

class DichVuService {
    _deleteFile(url) { if (url) { const p = path.join(__dirname, '../../../../public', url); if (fs.existsSync(p)) fs.unlinkSync(p); } }

    _tinhSoTuKhop(dichVu, tuKhoaArray) {
        let soTuKhop = 0;
        const tenDV = ` ${(dichVu.TenDV || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
        for (const tu of tuKhoaArray) if (tenDV.includes(tu)) soTuKhop += 1;
        return soTuKhop;
    }

    _tinhSoKyTuKhop(dichVu, tuKhoa) {
        let soKyTuKhop = 0;
        const tenDV = (dichVu.TenDV || '').toLowerCase();
        const tuKhoaArray = tuKhoa.split(/\s+/).filter(Boolean);
        for (const tu of tuKhoaArray) if (tenDV.includes(tu)) soKyTuKhop += tu.length;
        return soKyTuKhop;
    }

    async getList(query) {
        const search = (query.search || '').trim();
        const status = query.status || 'batHienThi';
        const sort = query.sort || 'macDinh';
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;

        let dichVus = await repo.getAll();
        dichVus = dichVus.map(d => d.toJSON());

        if (status === 'tatHienThi') dichVus = dichVus.filter(d => !d.TTHienThi);
        else if (status === 'batHienThi') dichVus = dichVus.filter(d => d.TTHienThi);

        if (sort === 'aDenZ') dichVus.sort((a, b) => (a.TenDV || '').localeCompare(b.TenDV || '', 'vi'));
        else if (sort === 'zDenA') dichVus.sort((a, b) => (b.TenDV || '').localeCompare(a.TenDV || '', 'vi'));

        let ketQuaTimKiem = null, suggestions = [];
        if (search) {
            const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
            const scored = dichVus.map(d => ({ d, diem: this._tinhSoTuKhop(d, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
            if (scored.length > 0) dichVus = scored.map(x => x.d);
            else { ketQuaTimKiem = 'Không có dịch vụ liên quan.'; suggestions = dichVus.slice(0, 3); dichVus = []; }
        }

        return { data: dichVus.slice((page - 1) * limit, page * limit), totalItems: dichVus.length, totalPages: Math.ceil(dichVus.length / limit), currentPage: page, message: ketQuaTimKiem, suggestions };
    }

    async getSuggestions(term, status) {
        if (!term) return [];
        let dichVus = await repo.getAll();
        dichVus = dichVus.map(d => d.toJSON());
        if (status === 'tatHienThi') dichVus = dichVus.filter(d => !d.TTHienThi);
        else if (status === 'batHienThi') dichVus = dichVus.filter(d => d.TTHienThi);

        const tuKhoa = term.toLowerCase();
        const scored = dichVus.map(d => ({ d, diem: this._tinhSoKyTuKhop(d, tuKhoa) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 3);
        return scored.map(x => x.d);
    }

    async getDetail(id) { return await repo.getById(id); }

    async create(dto, file) {
        const err = dto.validate(); if (err) throw new Error(err);
        const UrlIcon = file ? '/images/dichvu/' + file.filename : null;
        return await repo.create({ ...dto, UrlIcon });
    }

    async update(id, dto, file) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy');
        let UrlIcon = item.UrlIcon;
        if (file) { this._deleteFile(item.UrlIcon); UrlIcon = '/images/dichvu/' + file.filename; }
        return await item.update({ ...dto, UrlIcon });
    }

    async delete(id) {
        const item = await repo.getById(id);
        if (item) { this._deleteFile(item.UrlIcon); await repo.deleteById(id); }
    }

    async toggleStatus(id, statusVal) {
        const item = await repo.getById(id);
        if (item) await item.update({ TTHienThi: statusVal === 'true' || statusVal === true });
    }

    async bulkDelete(ids) {
        const items = await repo.getByIds(ids);
        for (const item of items) { this._deleteFile(item.UrlIcon); await item.destroy(); }
    }

    async bulkUpdateStatus(ids, status) { await repo.updateStatusBatch(ids, status === 'true' || status === true); }
}
module.exports = new DichVuService();