// apps/routes/admin/ttttVaMucTT.js
const express = require('express');
const router = express.Router();
const { TTTTvaMucTT } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.Ten = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await TTTTvaMucTT.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaMucTT', 'DESC']]
    });
    res.render('admin/ttttVaMucTT/index', {
      title: 'Quản lý TTTT và Mức TT',
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
    const results = await TTTTvaMucTT.findAll({
      where: { Ten: { [Op.like]: `%${q}%` } },
      attributes: ['MaMucTT', 'Ten'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/ttttVaMucTT/add', {
    title: 'Thêm TTTT và Mức TT',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { Ten, MucDo, TTHienThi } = req.body;
    await TTTTvaMucTT.create({
      Ten,
      MucDo: parseInt(MucDo),
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm thành công');
    res.redirect('/admin/tttt-muc-tt');
  } catch (err) {
    res.render('admin/ttttVaMucTT/add', {
      title: 'Thêm TTTT và Mức TT',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await TTTTvaMucTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy');
      return res.redirect('/admin/tttt-muc-tt');
    }
    res.render('admin/ttttVaMucTT/display', {
      title: 'Chi tiết TTTT và Mức TT',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await TTTTvaMucTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy');
      return res.redirect('/admin/tttt-muc-tt');
    }
    res.render('admin/ttttVaMucTT/update', {
      title: 'Cập nhật TTTT và Mức TT',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await TTTTvaMucTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy');
      return res.redirect('/admin/tttt-muc-tt');
    }
    const { Ten, MucDo, TTHienThi } = req.body;
    await item.update({
      Ten,
      MucDo: parseInt(MucDo),
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật thành công');
    res.redirect('/admin/tttt-muc-tt');
  } catch (err) {
    const item = await TTTTvaMucTT.findByPk(req.params.id).catch(() => null);
    res.render('admin/ttttVaMucTT/update', {
      title: 'Cập nhật TTTT và Mức TT',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await TTTTvaMucTT.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy');
      return res.redirect('/admin/tttt-muc-tt');
    }
    res.render('admin/ttttVaMucTT/delete', {
      title: 'Xóa TTTT và Mức TT',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await TTTTvaMucTT.destroy({ where: { MaMucTT: req.params.id } });
    req.flash('success_msg', 'Xóa thành công');
    res.redirect('/admin/tttt-muc-tt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await TTTTvaMucTT.destroy({ where: { MaMucTT: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} bản ghi`);
    res.redirect('/admin/tttt-muc-tt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await TTTTvaMucTT.findByPk(req.params.id);
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
    await TTTTvaMucTT.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaMucTT: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/tttt-muc-tt');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tttt-muc-tt');
  }
});

module.exports = router;
