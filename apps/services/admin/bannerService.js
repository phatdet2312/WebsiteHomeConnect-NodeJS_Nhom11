const repo = require('../../repositories/admin/bannerRepository');
const fs = require('fs');
const path = require('path');

class BannerService {
    // Hàm nội bộ dọn dẹp ảnh
    _deletePhysicalImage(urlAnh) {
        if (urlAnh) {
            const imgPath = path.join(__dirname, '../../../../public', urlAnh);
            if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
        }
    }

    async getListBanners(search, status, page, limit) {
        const offset = (page - 1) * limit;
        const result = await repo.getPaginatedBanners(search, status, limit, offset);
        return {
            items: result.rows,
            totalItems: result.count,
            totalPages: Math.ceil(result.count / limit)
        };
    }

    async getSearchSuggestions(query) { return await repo.searchSuggestions(query); }
    async getBannerDetail(id) { return await repo.getById(id); }

    async createBanner(dto, file) {
        const error = dto.validate();
        if (error) throw new Error(error);

        const UrlAnh = file ? '/images/banner/' + file.filename : null;
        await repo.create({ ...dto, UrlAnh });
    }

    async updateBanner(id, dto, file) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy banner');

        const error = dto.validate();
        if (error) throw new Error(error);

        let UrlAnh = item.UrlAnh;
        if (file) {
            this._deletePhysicalImage(item.UrlAnh); // Xóa ảnh cũ
            UrlAnh = '/images/banner/' + file.filename; // Gán ảnh mới
        }
        await item.update({ ...dto, UrlAnh });
    }

    async deleteBanner(id) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy banner');
        this._deletePhysicalImage(item.UrlAnh);
        await repo.deleteById(id);
    }

    async bulkDeleteBanners(ids) {
        const items = await repo.getByIds(ids);
        for (const item of items) { this._deletePhysicalImage(item.UrlAnh); }
        await repo.deleteByIds(ids);
    }

    async toggleStatus(id) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy');
        await item.update({ TTHienThi: !item.TTHienThi });
        return item.TTHienThi;
    }

    async bulkUpdateStatus(ids, status) {
        await repo.updateStatusBatch(ids, status === 'true');
    }
}
module.exports = new BannerService();