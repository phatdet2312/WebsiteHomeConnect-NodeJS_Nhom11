// apps/routes/admin/trangThai.js
const express = require('express');
const router = express.Router();
const { TrangThai } = require('../../models');
const { Op } = require('sequelize');
const { uploadTrangThai } = require('../../middleware/upload');
const path = require('path');
const fs = require('fs');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenTT = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await TrangThai.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaTT', 'DESC']]
    });
    res.render('admin/trangThai/index', {
      title: 'Quản lý Trạng thái',
      layout: 'layouts/admin',
      items: rows,
      totalItems: count,
      search: search || '',
      status: status || '',
      currentPage: +page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', err.message);
    res.redirect('/admin/dashboard');
  }
});

// GET /search-suggestions - AJAX
router.get('/search-suggestions', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) return res.json([]);
    const results = await TrangThai.findAll({
      where: { TenTT: { [Op.like]: `%${q}%` } },
      attributes: ['MaTT', 'TenTT'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/trangThai/add', {
    title: 'Thêm Trạng thái',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', uploadTrangThai, async (req, res) => {
  try {
    const { TenTT, TTHienThi } = req.body;
    const UrlAnh = req.file ? '/images/TrangThai/' + req.file.filename : null;
    await TrangThai.create({
      TenTT,
      UrlAnh,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm trạng thái thành công');
    res.redirect('/admin/trang-thai');
  } catch (err) {
    res.render('admin/trangThai/add', {
      title: 'Thêm Trạng thái',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy trạng thái');
      return res.redirect('/admin/trang-thai');
    }
    res.render('admin/trangThai/display', {
      title: 'Chi tiết Trạng thái',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy trạng thái');
      return res.redirect('/admin/trang-thai');
    }
    res.render('admin/trangThai/update', {
      title: 'Cập nhật Trạng thái',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

// POST /update/:id - save
router.post('/update/:id', uploadTrangThai, async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy trạng thái');
      return res.redirect('/admin/trang-thai');
    }
    const { TenTT, TTHienThi } = req.body;
    let UrlAnh = item.UrlAnh;
    if (req.file) {
      if (item.UrlAnh) {
        const oldPath = path.join(__dirname, '../../../public', item.UrlAnh);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      UrlAnh = '/images/TrangThai/' + req.file.filename;
    }
    await item.update({
      TenTT,
      UrlAnh,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/trang-thai');
  } catch (err) {
    const item = await TrangThai.findByPk(req.params.id).catch(() => null);
    res.render('admin/trangThai/update', {
      title: 'Cập nhật Trạng thái',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy trạng thái');
      return res.redirect('/admin/trang-thai');
    }
    res.render('admin/trangThai/delete', {
      title: 'Xóa Trạng thái',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (item && item.UrlAnh) {
      const imgPath = path.join(__dirname, '../../../public', item.UrlAnh);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await TrangThai.destroy({ where: { MaTT: req.params.id } });
    req.flash('success_msg', 'Xóa trạng thái thành công');
    res.redirect('/admin/trang-thai');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    const items = await TrangThai.findAll({ where: { MaTT: ids } });
    for (const item of items) {
      if (item.UrlAnh) {
        const imgPath = path.join(__dirname, '../../../public', item.UrlAnh);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    }
    await TrangThai.destroy({ where: { MaTT: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} trạng thái`);
    res.redirect('/admin/trang-thai');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await TrangThai.findByPk(req.params.id);
    if (!item) return res.json({ success: false, message: 'Không tìm thấy' });
    await item.update({ TTHienThi: !item.TTHienThi });
    res.json({ success: true, newStatus: item.TTHienThi });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

// POST /update-status-batch - bulk status
router.post('/update-status-batch', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await TrangThai.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaTT: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/trang-thai');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/trang-thai');
  }
});

module.exports = router;
