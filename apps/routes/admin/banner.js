// apps/routes/admin/banner.js
const express = require('express');
const router = express.Router();
const { BannerQuangCao } = require('../../models');
const { Op } = require('sequelize');
const { uploadBanner } = require('../../middleware/upload');
const path = require('path');
const fs = require('fs');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.MoTa = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    const { count, rows } = await BannerQuangCao.findAndCountAll({
      where,
      limit,
      offset,
      order: [['MaAQC', 'DESC']]
    });
    res.render('admin/banner/index', {
      title: 'Quản lý Banner',
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
    const results = await BannerQuangCao.findAll({
      where: { MoTa: { [Op.like]: `%${q}%` } },
      attributes: ['MaAQC', 'MoTa'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', (req, res) => {
  res.render('admin/banner/add', {
    title: 'Thêm Banner',
    layout: 'layouts/admin',
    item: null,
    errors: []
  });
});

// POST /add - create
router.post('/add', uploadBanner, async (req, res) => {
  try {
    const { MoTa, GhiChu, UrlDichDen, TTHienThi } = req.body;
    const UrlAnh = req.file ? '/images/banner/' + req.file.filename : null;
    await BannerQuangCao.create({
      MoTa,
      GhiChu: GhiChu || null,
      UrlDichDen: UrlDichDen || '#',
      UrlAnh,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Thêm banner thành công');
    res.redirect('/admin/banner');
  } catch (err) {
    res.render('admin/banner/add', {
      title: 'Thêm Banner',
      layout: 'layouts/admin',
      item: req.body,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy banner');
      return res.redirect('/admin/banner');
    }
    res.render('admin/banner/display', {
      title: 'Chi tiết Banner',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy banner');
      return res.redirect('/admin/banner');
    }
    res.render('admin/banner/update', {
      title: 'Cập nhật Banner',
      layout: 'layouts/admin',
      item,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

// POST /update/:id - save
router.post('/update/:id', uploadBanner, async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy banner');
      return res.redirect('/admin/banner');
    }
    const { MoTa, GhiChu, UrlDichDen, TTHienThi } = req.body;
    let UrlAnh = item.UrlAnh;
    if (req.file) {
      // Remove old image
      if (item.UrlAnh) {
        const oldPath = path.join(__dirname, '../../../public', item.UrlAnh);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      UrlAnh = '/images/banner/' + req.file.filename;
    }
    await item.update({
      MoTa,
      GhiChu: GhiChu || null,
      UrlDichDen: UrlDichDen || '#',
      UrlAnh,
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true'
    });
    req.flash('success_msg', 'Cập nhật banner thành công');
    res.redirect('/admin/banner');
  } catch (err) {
    const item = await BannerQuangCao.findByPk(req.params.id).catch(() => null);
    res.render('admin/banner/update', {
      title: 'Cập nhật Banner',
      layout: 'layouts/admin',
      item: item || req.body,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy banner');
      return res.redirect('/admin/banner');
    }
    res.render('admin/banner/delete', {
      title: 'Xóa Banner',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
    if (item && item.UrlAnh) {
      const imgPath = path.join(__dirname, '../../../public', item.UrlAnh);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    await BannerQuangCao.destroy({ where: { MaAQC: req.params.id } });
    req.flash('success_msg', 'Xóa banner thành công');
    res.redirect('/admin/banner');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    // Remove images
    const items = await BannerQuangCao.findAll({ where: { MaAQC: ids } });
    for (const item of items) {
      if (item.UrlAnh) {
        const imgPath = path.join(__dirname, '../../../public', item.UrlAnh);
        if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
      }
    }
    await BannerQuangCao.destroy({ where: { MaAQC: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} banner`);
    res.redirect('/admin/banner');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await BannerQuangCao.findByPk(req.params.id);
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
    await BannerQuangCao.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaAQC: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/banner');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/banner');
  }
});

module.exports = router;
