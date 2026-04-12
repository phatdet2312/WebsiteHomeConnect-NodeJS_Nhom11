// apps/routes/home.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// GET / - Homepage
router.get('/', (_req, res) => {
  res.render('home/index', { title: 'HomeConnect - Hệ thống quản lý căn hộ', layout: 'layouts/main' });
});

// GET /dich-vu
router.get('/dich-vu', (_req, res) => {
  res.render('home/dichVu', { title: 'Dịch vụ - HomeConnect', layout: 'layouts/main' });
});

// GET /hoa-don-dich-vu
router.get('/hoa-don-dich-vu', (_req, res) => {
  res.render('home/hoaDonDichVu', { title: 'Hóa đơn dịch vụ', layout: 'layouts/main' });
});


module.exports = router;
 