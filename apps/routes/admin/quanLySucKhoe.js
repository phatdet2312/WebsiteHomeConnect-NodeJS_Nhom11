// apps/routes/admin/quanLySucKhoe.js
const express = require('express');
const router = express.Router();
const { ChiSoSucKhoe, KhachHang } = require('../../models');
const { Op } = require('sequelize');

// GET / - list ChiSoSucKhoe with KhachHang info
router.get('/', async (req, res) => {
  try {
    const { search, page = 1 } = req.query;
    const limit = 15;
    const offset = (page - 1) * limit;
    const where = {};

    const khachHangWhere = {};
    if (search) khachHangWhere.TenKH = { [Op.like]: `%${search}%` };

    const { count, rows } = await ChiSoSucKhoe.findAndCountAll({
      where,
      limit,
      offset,
      order: [['ThoiGianDo', 'DESC']],
      include: [
        {
          model: KhachHang,
          where: Object.keys(khachHangWhere).length ? khachHangWhere : undefined,
          required: Object.keys(khachHangWhere).length > 0,
          attributes: ['MaKH', 'TenKH', 'EmailKH', 'DTKH']
        }
      ],
      subQuery: false
    });

    res.render('admin/quanLySucKhoe/index', {
      title: 'Quản lý Sức khỏe',
      layout: 'layouts/admin',
      items: rows,
      totalItems: count,
      search: search || '',
      currentPage: +page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', err.message);
    res.redirect('/admin/dashboard');
  }
});

// GET /display/:id - view detail of a health record
router.get('/display/:id', async (req, res) => {
  try {
    const item = await ChiSoSucKhoe.findByPk(req.params.id, {
      include: [{ model: KhachHang, attributes: ['MaKH', 'TenKH', 'EmailKH', 'DTKH', 'AvatarUrl'] }]
    });
    if (!item) {
      req.flash('error_msg', 'Không tìm thấy chỉ số sức khỏe');
      return res.redirect('/admin/quan-ly-suc-khoe');
    }
    res.render('admin/quanLySucKhoe/display', {
      title: 'Chi tiết Sức khỏe',
      layout: 'layouts/admin',
      item
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/quan-ly-suc-khoe');
  }
});

// GET /khach-hang/:maKH - view all health records for a customer
router.get('/khach-hang/:maKH', async (req, res) => {
  try {
    const khachHang = await KhachHang.findByPk(req.params.maKH, {
      include: [{ model: ChiSoSucKhoe }]
    });
    if (!khachHang) {
      req.flash('error_msg', 'Không tìm thấy khách hàng');
      return res.redirect('/admin/quan-ly-suc-khoe');
    }
    res.render('admin/quanLySucKhoe/khachHang', {
      title: `Sức khỏe của ${khachHang.TenKH}`,
      layout: 'layouts/admin',
      khachHang,
      items: khachHang.ChiSoSucKhoes || []
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/quan-ly-suc-khoe');
  }
});

module.exports = router;
