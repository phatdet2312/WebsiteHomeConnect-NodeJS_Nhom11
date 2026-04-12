// apps/routes/canho.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const ctrl = require('../controllers/canHoKhachHangController');

router.use(isCustomer);
router.get('/', ctrl.renderIndex);
router.get('/chi-tiet/:maHopDong', ctrl.renderChiTiet);

router.get('/api/my-contracts', ctrl.apiGetMyContracts);
router.get('/api/my-contracts/:id', ctrl.apiGetContractDetail);

module.exports = router;