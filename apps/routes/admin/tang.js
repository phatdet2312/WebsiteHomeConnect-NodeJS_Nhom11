// apps/routes/admin/tang.js
const express = require('express');
const router = express.Router();
const { Tang, ToaNha } = require('../../models');
const { Op } = require('sequelize');

// GET / - list with search + pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, maToaNha, page = 1 } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;
    const where = {};
    if (search) where.TenTang = { [Op.like]: `%${search}%` };
    if (status !== undefined && status !== '') where.TTHienThi = status === 'true';
    if (maToaNha && maToaNha !== '') where.MaToaNha = parseInt(maToaNha);
    const [{ count, rows }, toaNhaList] = await Promise.all([
      Tang.findAndCountAll({
        where, 
        limit,
        offset,
        order: [['MaTang', 'DESC']],
        include: [{ model: ToaNha, attributes: ['MaToaNha', 'TenToaNha'] }]
      }),
      ToaNha.findAll({ order: [['TenToaNha', 'ASC']] })
    ]);
    const items = rows.map(r => ({
      ...r.toJSON(),
      TenToaNha: r.ToaNha ? r.ToaNha.TenToaNha : '—'
    }));
    res.render('admin/tang/index', {
      title: 'Quản lý Tầng',
      layout: 'layouts/admin',
      items,
      totalItems: count,
      search: search || '',
      status: status || '',
      maToaNha: maToaNha || '',
      toaNhaList,
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
    const results = await Tang.findAll({
      where: { TenTang: { [Op.like]: `%${q}%` } },
      attributes: ['MaTang', 'TenTang'],
      limit: 10
    });
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// GET /add - show form
router.get('/add', async (req, res) => {
  try {
    const toaNhaList = await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha', 'ASC']] });
    res.render('admin/tang/add', {
      title: 'Thêm Tầng',
      layout: 'layouts/admin',
      item: null,
      toaNhaList,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// POST /add - create
router.post('/add', async (req, res) => {
  try {
    const { TenTang, SoHanhLang, MaToaNha, TTHienThi, TTDeXuat } = req.body;
    await Tang.create({
      TenTang,
      SoHanhLang: parseInt(SoHanhLang) || 0,
      MaToaNha: parseInt(MaToaNha),
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Thêm tầng thành công');
    res.redirect('/admin/tang');
  } catch (err) {
    const toaNhaList = await ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }).catch(() => []);
    res.render('admin/tang/add', {
      title: 'Thêm Tầng',
      layout: 'layouts/admin',
      item: req.body,
      toaNhaList,
      errors: [err.message]
    });
  }
});

// GET /display/:id - view
router.get('/display/:id', async (req, res) => {
  try {
    const item = await Tang.findByPk(req.params.id, {
      include: [{ model: ToaNha, attributes: ['MaToaNha', 'TenToaNha'] }]
    });
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tầng');
      return res.redirect('/admin/tang');
    }
    res.render('admin/tang/display', {
      title: 'Chi tiết Tầng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// GET /update/:id - edit form
router.get('/update/:id', async (req, res) => {
  try {
    const item = await Tang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tầng');
      return res.redirect('/admin/tang');
    }
    const toaNhaList = await ToaNha.findAll({ order: [['TenToaNha', 'ASC']] });
    res.render('admin/tang/update', {
      title: 'Cập nhật Tầng',
      layout: 'layouts/admin',
      item,
      toaNhaList,
      errors: []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// POST /update/:id - save
router.post('/update/:id', async (req, res) => {
  try {
    const item = await Tang.findByPk(req.params.id);
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tầng');
      return res.redirect('/admin/tang');
    }
    const { TenTang, SoHanhLang, MaToaNha, TTHienThi, TTDeXuat } = req.body;
    await item.update({
      TenTang,
      SoHanhLang: parseInt(SoHanhLang) || 0,
      MaToaNha: parseInt(MaToaNha),
      TTHienThi: TTHienThi === 'on' || TTHienThi === 'true',
      TTDeXuat: TTDeXuat === 'on' || TTDeXuat === 'true'
    });
    req.flash('success_msg', 'Cập nhật tầng thành công');
    res.redirect('/admin/tang');
  } catch (err) {
    const item = await Tang.findByPk(req.params.id).catch(() => null);
    const toaNhaList = await ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }).catch(() => []);
    res.render('admin/tang/update', {
      title: 'Cập nhật Tầng',
      layout: 'layouts/admin',
      item: item || req.body,
      toaNhaList,
      errors: [err.message]
    });
  }
});

// GET /delete/:id - confirm
router.get('/delete/:id', async (req, res) => {
  try {
    const item = await Tang.findByPk(req.params.id, {
      include: [{ model: ToaNha, attributes: ['TenToaNha'] }]
    });
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy tầng');
      return res.redirect('/admin/tang');
    }
    res.render('admin/tang/delete', {
      title: 'Xóa Tầng',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// POST /delete/:id - execute
router.post('/delete/:id', async (req, res) => {
  try {
    await Tang.destroy({ where: { MaTang: req.params.id } });
    req.flash('success_msg', 'Xóa tầng thành công');
    res.redirect('/admin/tang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// POST /delete-multiple - bulk delete
router.post('/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [req.body.ids];
    await Tang.destroy({ where: { MaTang: ids } });
    req.flash('success_msg', `Đã xóa ${ids.length} tầng`);
    res.redirect('/admin/tang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

// POST /change-status/:id - toggle TTHienThi
router.post('/change-status/:id', async (req, res) => {
  try {
    const item = await Tang.findByPk(req.params.id);
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
    await Tang.update(
      { TTHienThi: req.body.status === 'true' },
      { where: { MaTang: ids } }
    );
    req.flash('success_msg', 'Cập nhật trạng thái thành công');
    res.redirect('/admin/tang');
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/tang');
  }
});

module.exports = router;
