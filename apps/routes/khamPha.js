// apps/routes/khamPha.js
const express = require('express');
const router = express.Router();

// GET / - Discover apartments
router.get('/', (_req, res) => {
  res.render('khamPha/index', { title: 'Khám phá căn hộ - HomeConnect', layout: 'layouts/main' });
});

module.exports = router;
 