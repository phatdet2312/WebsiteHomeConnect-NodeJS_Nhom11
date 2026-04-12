// apps/routes/admin/danhMucNoiThat.js
const express = require('express');
const router = express.Router();
const { DanhMucNoiThat } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenDMNT = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await DanhMucNoiThat.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaDMNT', 'DESC']]
    });
    res.render('admin/danhMucNoiThat/index', {
      title: 'Quản lý Danh mục Nội thất',
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
    const results = await DanhMucNoiThat.findAll({
      where: { TenDMNT: { [Op.like]: `%${q}%` } },
      attributes: ['MaDMNT', 'TenDMNT'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/danhMucNoiThat/add', {
    title: 'Thêm Danh mục Nội thất',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { TenDMNT, TTHienThi, TTDeXuat } = req.body;
    await DanhMucNoiThat.create({
      TenDMNT,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Thêm danh mục nội thất thành công');
    res.redirect('/admin/danh-muc-noi-that');
  } catch (err) {
    res.render('admin/danhMucNoiThat/add', {
      title: 'Thêm Danh mục Nội thất',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await DanhMucNoiThat.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy danh mục');
      return res.redirect('/admin/danh-muc-noi-that');
    }
    res.render('admin/danhMucNoiThat/display', {
      title: 'Chi tiết Danh mục Nội thất',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await DanhMucNoiThat.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy danh mục');
      return res.redirect('/admin/danh-muc-noi-that');
    }
    res.render('admin/danhMucNoiThat/update', {
      title: 'Cập nhật Danh mục Nội thất',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await DanhMucNoiThat.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy danh mục');
      return res.redirect('/admin/danh-muc-noi-that');
    }
    const { TenDMNT, TTHienThi, TTDeXuat } = req.body;
    await item.update({
      TenDMNT,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Cập nhật danh mục nội thất thành công');
    res.redirect('/admin/danh-muc-noi-that');
  } catch (err) {
    const item = await DanhMucNoiThat.findByPk(req.params.id).catch(() => null);
    res.render('admin/danhMucNoiThat/update', {
      title: 'Cập nhật Danh mục Nội thất',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await DanhMucNoiThat.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy danh mục');
      return res.redirect('/admin/danh-muc-noi-that');
    }
    res.render('admin/danhMucNoiThat/delete', {
      title: 'Xóa Danh mục Nội thất',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await DanhMucNoiThat.destroy({ where: { MaDMNT: req.params.id } });
    req.flash('success_msg', 'Xóa danh mục nội thất thành công');
    res.redirect('/admin/danh-muc-noi-that');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await DanhMucNoiThat.destroy({ where: { MaDMNT: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} danh mục`);
    res.redirect('/admin/danh-muc-noi-that');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await DanhMucNoiThat.findByPk(req.params.id);
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
    await DanhMucNoiThat.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaDMNT: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/danh-muc-noi-that');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/danh-muc-noi-that');
  }
});

module.exports = router;
