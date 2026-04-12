const express = require('express');
const router = express.Router();
const { DichVu } = require('../../models');
const { Op } = require('sequelize');
const { uploadDichVu } = require('../../middleware/upload');
const path = require('path');
const fs = require('fs');

// =========================================================================
// 1. THUẬT TOÁN TÌM KIẾM (Kế thừa 100% từ C#)
// =========================================================================
function tinhSoTuKhop(dichVu, tuKhoaArray) {
    let soTuKhop = 0;
    const tenDV = ` ${(dichVu.TenDV || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
    for (const tu of tuKhoaArray) {
        if (tenDV.includes(tu)) soTuKhop += 1;
    }
    return soTuKhop;
}

function tinhSoKyTuKhop(dichVu, tuKhoa) {
    let soKyTuKhop = 0;
    const tenDV = (dichVu.TenDV || '').toLowerCase();
    const tuKhoaArray = tuKhoa.split(/\s+/).filter(Boolean);
    for (const tu of tuKhoaArray) {
        if (tenDV.includes(tu)) soKyTuKhop += tu.length;
    }
    return soKyTuKhop;
}

// =========================================================================
// 2. API ENDPOINTS (100% API JSON)
// =========================================================================

// API: Lấy danh sách dịch vụ (Có phân trang, tìm kiếm, lọc, sắp xếp)
router.get('/api/list', async (req, res) => {
    try {
        const search = (req.query.search || '').trim();
        const status = req.query.status || 'batHienThi';
        const sort = req.query.sort || 'macDinh';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        let dichVus = await DichVu.findAll({ order: [['MaDV', 'DESC']] });
        dichVus = dichVus.map(d => d.toJSON());

        // Lọc trạng thái
        if (status === 'tatHienThi') dichVus = dichVus.filter(d => !d.TTHienThi);
        else if (status === 'batHienThi') dichVus = dichVus.filter(d => d.TTHienThi);

        // Sắp xếp
        if (sort === 'aDenZ') dichVus.sort((a, b) => (a.TenDV || '').localeCompare(b.TenDV || '', 'vi'));
        else if (sort === 'zDenA') dichVus.sort((a, b) => (b.TenDV || '').localeCompare(a.TenDV || '', 'vi'));

        let ketQuaTimKiem = null;
        let suggestionList = [];

        // Tìm kiếm
        if (search) {
            const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
            const scored = dichVus
                .map(d => ({ d, diem: tinhSoTuKhop(d, tuKhoaArray) }))
                .filter(x => x.diem > 0)
                .sort((a, b) => b.diem - a.diem);

            if (scored.length > 0) {
                dichVus = scored.map(x => x.d);
            } else {
                ketQuaTimKiem = 'Không có dịch vụ liên quan.';
                suggestionList = dichVus.slice(0, 3); // Trả về 3 gợi ý nếu không thấy
                dichVus = [];
            }
        }

        // Phân trang bằng Array.slice
        const totalItems = dichVus.length;
        const totalPages = Math.ceil(totalItems / limit);
        const paginatedData = dichVus.slice((page - 1) * limit, page * limit);

        res.json({
            success: true,
            data: paginatedData,
            totalItems,
            totalPages,
            currentPage: page,
            message: ketQuaTimKiem,
            suggestions: suggestionList
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Gợi ý tìm kiếm (Autocomplete)
router.get('/api/suggestions', async (req, res) => {
    try {
        const { term = '', status = 'batHienThi' } = req.query;
        if (!term) return res.json({ success: true, data: [] });

        let dichVus = await DichVu.findAll();
        dichVus = dichVus.map(d => d.toJSON());

        if (status === 'tatHienThi') dichVus = dichVus.filter(d => !d.TTHienThi);
        else if (status === 'batHienThi') dichVus = dichVus.filter(d => d.TTHienThi);

        const tuKhoa = term.toLowerCase();
        const scored = dichVus
            .map(d => ({ d, diem: tinhSoKyTuKhop(d, tuKhoa) }))
            .filter(x => x.diem > 0)
            .sort((a, b) => b.diem - a.diem)
            .slice(0, 3);

        res.json({ success: true, data: scored.map(x => x.d) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Lấy chi tiết 1 dịch vụ
router.get('/api/detail/:id', async (req, res) => {
    try {
        const item = await DichVu.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        res.json({ success: true, data: item });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Thêm dịch vụ
router.post('/api/add', uploadDichVu, async (req, res) => {
    try {
        const { TenDV, TTHienThi } = req.body;
        if (!TenDV) return res.status(400).json({ success: false, message: 'Tên dịch vụ không được để trống' });

        const UrlIcon = req.file ? '/images/dichvu/' + req.file.filename : null;
        const newDV = await DichVu.create({
            TenDV,
            UrlIcon,
            TTHienThi: TTHienThi === 'true' || TTHienThi === 'on'
        });
        res.json({ success: true, message: 'Thêm dịch vụ thành công!', data: newDV });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Cập nhật dịch vụ
router.post('/api/update/:id', uploadDichVu, async (req, res) => {
    try {
        const item = await DichVu.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });

        const { TenDV, TTHienThi } = req.body;
        let UrlIcon = item.UrlIcon;

        if (req.file) {
            if (item.UrlIcon) {
                const oldPath = path.join(__dirname, '../../../public', item.UrlIcon);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            UrlIcon = '/images/dichvu/' + req.file.filename;
        }

        await item.update({
            TenDV: TenDV || item.TenDV,
            UrlIcon,
            TTHienThi: TTHienThi === 'true' || TTHienThi === 'on'
        });

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Xóa 1 dịch vụ
router.post('/api/delete/:id', async (req, res) => {
    try {
        const item = await DichVu.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });

        if (item.UrlIcon) {
            const iconPath = path.join(__dirname, '../../../public', item.UrlIcon);
            if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
        }
        await item.destroy();
        res.json({ success: true, message: 'Xóa dịch vụ thành công!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Đổi trạng thái 1 dịch vụ
router.post('/api/change-status/:id', async (req, res) => {
    try {
        const item = await DichVu.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        
        await item.update({ TTHienThi: req.body.status === 'true' || req.body.status === true });
        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Xóa nhiều
router.post('/api/delete-multiple', async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
        if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn dịch vụ nào' });

        const items = await DichVu.findAll({ where: { MaDV: ids } });
        for (const item of items) {
            if (item.UrlIcon) {
                const iconPath = path.join(__dirname, '../../../public', item.UrlIcon);
                if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
            }
            await item.destroy();
        }
        res.json({ success: true, message: `Đã xóa ${items.length} dịch vụ` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// API: Cập nhật trạng thái nhiều
router.post('/api/update-status-batch', async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
        if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn dịch vụ nào' });

        await DichVu.update(
            { TTHienThi: req.body.status === 'true' || req.body.status === true },
            { where: { MaDV: ids } }
        );
        res.json({ success: true, message: `Đã cập nhật trạng thái cho ${ids.length} dịch vụ` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// =========================================================================
// 3. RENDER VIEWS (Chỉ trả về khung HTML rỗng, Client tự gọi API render)
// =========================================================================

router.get('/', (req, res) => {
    res.render('admin/dichVu/index', { title: 'Quản lý Dịch vụ', layout: 'layouts/admin' });
});

router.get('/add', (req, res) => {
    res.render('admin/dichVu/add', { title: 'Thêm Dịch vụ', layout: 'layouts/admin' });
});

router.get('/update/:id', (req, res) => {
    res.render('admin/dichVu/update', { title: 'Cập nhật Dịch vụ', layout: 'layouts/admin', id: req.params.id });
});

router.get('/display/:id', (req, res) => {
    res.render('admin/dichVu/display', { title: 'Chi tiết Dịch vụ', layout: 'layouts/admin', id: req.params.id });
});

module.exports = router;