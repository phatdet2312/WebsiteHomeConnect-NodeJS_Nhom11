// apps/routes/admin/loaiTTHD.js
const express = require('express');
const router = express.Router();
const { LoaiTTHD } = require('../../models');
const { Op } = require('sequelize');
const { uploadLoaiTTHD } = require('../../middleware/upload');
const path = require('path');
const fs = require('fs');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenLoaiTT = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await LoaiTTHD.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaLoaiTT', 'DESC']]
    });
    res.render('admin/loaiTTHD/index', {
      title: 'Quản lý Loại Thanh toán Hợp đồng',
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
    const results = await LoaiTTHD.findAll({
      where: { TenLoaiTT: { [Op.like]: `%${q}%` } },
      attributes: ['MaLoaiTT', 'TenLoaiTT'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/loaiTTHD/add', {
    title: 'Thêm Loại Thanh toán Hợp đồng',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', uploadLoaiTTHD, async (req, res) => {
  try {
    const { TenLoaiTT, TTHienThi } = req.body;
    const UrlIcon = req.file ? '/images/loaitthd/' + req.file.filename : null;
    await LoaiTTHD.create({
      TenLoaiTT,
      UrlIcon,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm loại thanh toán thành công');
    res.redirect('/admin/loai-tt-hd');
  } catch (err) {
    res.render('admin/loaiTTHD/add', {
      title: 'Thêm Loại Thanh toán Hợp đồng',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy loại thanh toán');
      return res.redirect('/admin/loai-tt-hd');
    }
    res.render('admin/loaiTTHD/display', {
      title: 'Chi tiết Loại Thanh toán Hợp đồng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy loại thanh toán');
      return res.redirect('/admin/loai-tt-hd');
    }
    res.render('admin/loaiTTHD/update', {
      title: 'Cập nhật Loại Thanh toán Hợp đồng',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

// POST /update/:id - save
router.post('/update/:id', uploadLoaiTTHD, async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy loại thanh toán');
      return res.redirect('/admin/loai-tt-hd');
    }
    const { TenLoaiTT, TTHienThi } = req.body;
    let UrlIcon = item.UrlIcon;
    if (req.file) {
      if (item.UrlIcon) {
        const oldPath = path.join(__dirname, '../../../public', item.UrlIcon);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      UrlIcon = '/images/loaitthd/' + req.file.filename;
    }
    await item.update({
      TenLoaiTT,
      UrlIcon,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật loại thanh toán thành công');
    res.redirect('/admin/loai-tt-hd');
  } catch (err) {
    const item = await LoaiTTHD.findByPk(req.params.id).catch(() => null);
    res.render('admin/loaiTTHD/update', {
      title: 'Cập nhật Loại Thanh toán Hợp đồng',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy loại thanh toán');
      return res.redirect('/admin/loai-tt-hd');
    }
    res.render('admin/loaiTTHD/delete', {
      title: 'Xóa Loại Thanh toán Hợp đồng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
    if (item && item.UrlIcon) {
      const iconPath = path.join(__dirname, '../../../public', item.UrlIcon);
      if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
    }
    await LoaiTTHD.destroy({ where: { MaLoaiTT: req.params.id } });
    req.flash('success_msg', 'Xóa loại thanh toán thành công');
    res.redirect('/admin/loai-tt-hd');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    const items = await LoaiTTHD.findAll({ where: { MaLoaiTT: ids } });
    for (const item of items) {
      if (item.UrlIcon) {
        const iconPath = path.join(__dirname, '../../../public', item.UrlIcon);
        if (fs.existsSync(iconPath)) fs.unlinkSync(iconPath);
      }
    }
    await LoaiTTHD.destroy({ where: { MaLoaiTT: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} loại thanh toán`);
    res.redirect('/admin/loai-tt-hd');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await LoaiTTHD.findByPk(req.params.id);
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
    await LoaiTTHD.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaLoaiTT: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/loai-tt-hd');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/loai-tt-hd');
  }
});

module.exports = router;
