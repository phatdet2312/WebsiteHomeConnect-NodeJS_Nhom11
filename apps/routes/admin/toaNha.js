// apps/routes/admin/toaNha.js
const express = require('express');
const router = express.Router();
const { ToaNha, Tang } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenToaNha = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await ToaNha.findAndCountAll({
      where,
      limit, 
      offset, 
      order: [['MaToaNha', 'DESC']]
    });
    res.render('admin/toaNha/index', {
      title: 'Quản lý Tòa nhà',
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
    const results = await ToaNha.findAll({
      where: { TenToaNha: { [Op.like]: `%${q}%` } },
      attributes: ['MaToaNha', 'TenToaNha'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/toaNha/add', {
    title: 'Thêm Tòa nhà',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { TenToaNha, TTHienThi, TTDeXuat } = req.body;
    await ToaNha.create({
      TenToaNha,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Thêm tòa nhà thành công');
    res.redirect('/admin/toa-nha');
  } catch (err) {
    res.render('admin/toaNha/add', {
      title: 'Thêm Tòa nhà',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await ToaNha.findByPk(req.params.id, {
      include: [{ model: Tang }]
    });
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tòa nhà');
      return res.redirect('/admin/toa-nha');
    }
    res.render('admin/toaNha/display', {
      title: 'Chi tiết Tòa nhà',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await ToaNha.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tòa nhà');
      return res.redirect('/admin/toa-nha');
    }
    res.render('admin/toaNha/update', {
      title: 'Cập nhật Tòa nhà',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await ToaNha.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tòa nhà');
      return res.redirect('/admin/toa-nha');
    }
    const { TenToaNha, TTHienThi, TTDeXuat } = req.body;
    await item.update({
      TenToaNha,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Cập nhật tòa nhà thành công');
    res.redirect('/admin/toa-nha');
  } catch (err) {
    const item = await ToaNha.findByPk(req.params.id).catch(() => null);
    res.render('admin/toaNha/update', {
      title: 'Cập nhật Tòa nhà',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await ToaNha.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tòa nhà');
      return res.redirect('/admin/toa-nha');
    }
    res.render('admin/toaNha/delete', {
      title: 'Xóa Tòa nhà',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await ToaNha.destroy({ where: { MaToaNha: req.params.id } });
    req.flash('success_msg', 'Xóa tòa nhà thành công');
    res.redirect('/admin/toa-nha');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await ToaNha.destroy({ where: { MaToaNha: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} tòa nhà`);
    res.redirect('/admin/toa-nha');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await ToaNha.findByPk(req.params.id);
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
    await ToaNha.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaToaNha: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/toa-nha');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/toa-nha');
  }
});

module.exports = router;
