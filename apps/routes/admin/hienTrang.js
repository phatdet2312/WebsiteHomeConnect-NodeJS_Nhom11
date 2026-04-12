// apps/routes/admin/hienTrang.js
const express = require('express');
const router = express.Router();
const { HienTrang } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenHienTrang = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await HienTrang.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaHienTrang', 'DESC']]
    });
    res.render('admin/hienTrang/index', {
      title: 'Quản lý Hiện trạng',
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
    const results = await HienTrang.findAll({
      where: { TenHienTrang: { [Op.like]: `%${q}%` } },
      attributes: ['MaHienTrang', 'TenHienTrang'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/hienTrang/add', {
    title: 'Thêm Hiện trạng',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { TenHienTrang, MucDo, TTHienThi } = req.body;
    await HienTrang.create({
      TenHienTrang,
      MucDo: MucDo ? parseInt(MucDo) : null,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm hiện trạng thành công');
    res.redirect('/admin/hien-trang');
  } catch (err) {
    res.render('admin/hienTrang/add', {
      title: 'Thêm Hiện trạng',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await HienTrang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy hiện trạng');
      return res.redirect('/admin/hien-trang');
    }
    res.render('admin/hienTrang/display', {
      title: 'Chi tiết Hiện trạng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await HienTrang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy hiện trạng');
      return res.redirect('/admin/hien-trang');
    }
    res.render('admin/hienTrang/update', {
      title: 'Cập nhật Hiện trạng',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await HienTrang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy hiện trạng');
      return res.redirect('/admin/hien-trang');
    }
    const { TenHienTrang, MucDo, TTHienThi } = req.body;
    await item.update({
      TenHienTrang,
      MucDo: MucDo ? parseInt(MucDo) : null,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật hiện trạng thành công');
    res.redirect('/admin/hien-trang');
  } catch (err) {
    const item = await HienTrang.findByPk(req.params.id).catch(() => null);
    res.render('admin/hienTrang/update', {
      title: 'Cập nhật Hiện trạng',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await HienTrang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy hiện trạng');
      return res.redirect('/admin/hien-trang');
    }
    res.render('admin/hienTrang/delete', {
      title: 'Xóa Hiện trạng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await HienTrang.destroy({ where: { MaHienTrang: req.params.id } });
    req.flash('success_msg', 'Xóa hiện trạng thành công');
    res.redirect('/admin/hien-trang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await HienTrang.destroy({ where: { MaHienTrang: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} hiện trạng`);
    res.redirect('/admin/hien-trang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await HienTrang.findByPk(req.params.id);
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
    await HienTrang.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaHienTrang: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/hien-trang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/hien-trang');
  }
});

module.exports = router;
