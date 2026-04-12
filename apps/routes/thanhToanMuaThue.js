// apps/routes/thanhToanMuaThue.js
const express = require('express');
const router = express.Router();
const thanhToanController = require('../controllers/thanhToanController');
const { isAuthenticated } = require('../middleware/auth');

router.use(isAuthenticated);

// Views
router.get('/', thanhToanController.renderIndex);
router.get('/callback-vnpay', thanhToanController.vnPayCallback);

// APIs
router.get('/api/items', thanhToanController.apiGetItems);
router.post('/xac-nhan', thanhToanController.apiCheckout);

module.exports = router;