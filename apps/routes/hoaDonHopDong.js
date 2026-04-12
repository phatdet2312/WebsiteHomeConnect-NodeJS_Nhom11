// routes/hoaDonHopDong.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const ctrl = require('../controllers/hoaDonHopDongController');

router.use(isCustomer);
router.get('/', ctrl.renderIndex);
router.get('/thanh-toan', ctrl.renderThanhToan);
router.get('/vnpay-return', ctrl.vnpayCallback);

router.get('/api/danh-sach', ctrl.apiGetDanhSach);
router.get('/api/unpaid', ctrl.apiGetUnpaid);
router.get('/api/history', ctrl.apiGetHistory);
router.post('/api/checkout', ctrl.apiCheckout);
router.post('/api/heartbeat', ctrl.apiHeartbeat);

module.exports = router;