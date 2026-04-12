// apps/routes/admin/pttt.js
const express = require('express');
const router = express.Router();
const { PTTT } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenPT = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await PTTT.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaPT', 'DESC']]
    });
    res.render('admin/pttt/index', {
      title: 'Quản lý Phương thức Thanh toán',
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
    const results = await PTTT.findAll({
      where: { TenPT: { [Op.like]: `%${q}%` } },
      attributes: ['MaPT', 'TenPT'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/pttt/add', {
    title: 'Thêm Phương thức Thanh toán',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { TenPT, TTHienThi } = req.body;
    await PTTT.create({
      TenPT,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm phương thức thanh toán thành công');
    res.redirect('/admin/pttt');
  } catch (err) {
    res.render('admin/pttt/add', {
      title: 'Thêm Phương thức Thanh toán',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await PTTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy phương thức thanh toán');
      return res.redirect('/admin/pttt');
    }
    res.render('admin/pttt/display', {
      title: 'Chi tiết Phương thức Thanh toán',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await PTTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy phương thức thanh toán');
      return res.redirect('/admin/pttt');
    }
    res.render('admin/pttt/update', {
      title: 'Cập nhật Phương thức Thanh toán',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await PTTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy phương thức thanh toán');
      return res.redirect('/admin/pttt');
    }
    const { TenPT, TTHienThi } = req.body;
    await item.update({
      TenPT,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật phương thức thanh toán thành công');
    res.redirect('/admin/pttt');
  } catch (err) {
    const item = await PTTT.findByPk(req.params.id).catch(() => null);
    res.render('admin/pttt/update', {
      title: 'Cập nhật Phương thức Thanh toán',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await PTTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy phương thức thanh toán');
      return res.redirect('/admin/pttt');
    }
    res.render('admin/pttt/delete', {
      title: 'Xóa Phương thức Thanh toán',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await PTTT.destroy({ where: { MaPT: req.params.id } });
    req.flash('success_msg', 'Xóa phương thức thanh toán thành công');
    res.redirect('/admin/pttt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await PTTT.destroy({ where: { MaPT: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} phương thức thanh toán`);
    res.redirect('/admin/pttt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await PTTT.findByPk(req.params.id);
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
    await PTTT.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaPT: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/pttt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/pttt');
  }
});

module.exports = router;
