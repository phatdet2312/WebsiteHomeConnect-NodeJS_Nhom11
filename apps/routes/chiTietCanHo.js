// apps/routes/chiTietCanHo.js
const express = require('express');
const router = express.Router();
const chiTietCanHoController = require('../controllers/chiTietCanHoController');

router.get('/:id', chiTietCanHoController.renderIndex);
router.get('/api/data/:id', chiTietCanHoController.apiGetDetail);

module.exports = router;