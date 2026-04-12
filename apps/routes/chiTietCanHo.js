// apps/routes/chiTietCanHo.js
const express = require('express');
const router = express.Router();

// GET /:id - Public apartment detail page
router.get('/:id', (_req, res) => {
  res.render('chiTietCanHo/index', { title: 'Chi tiết căn hộ - HomeConnect', layout: 'layouts/main' });
});

module.exports = router;
 