// apps/routes/home.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// GET / - Homepage
router.get('/', (_req, res) => {
  res.render('home/index', { title: 'HomeConnect - Hệ thống quản lý căn hộ', layout: 'layouts/main' });
});


module.exports = router;
