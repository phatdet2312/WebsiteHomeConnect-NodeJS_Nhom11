// apps/routes/canho.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// GET / - Apartment list for customer
router.get('/', (_req, res) => {
  res.render('canho/index', { title: 'Căn hộ của tôi', layout: 'layouts/main' });
});

// GET /chi-tiet/:maHopDong
router.get('/chi-tiet/:maHopDong', (_req, res) => {
  res.render('canho/chiTiet', { title: 'Chi tiết hợp đồng', layout: 'layouts/main' });
});

module.exports = router;
 