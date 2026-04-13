// apps/routes/admin/thongKe.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/thongKeController');

router.get('/', ctrl.renderDashboard);
router.get('/doanh-thu', ctrl.renderDoanhThu);
router.get('/hop-dong', ctrl.renderHopDong);
router.get('/can-ho', ctrl.renderCanHo);

module.exports = router;