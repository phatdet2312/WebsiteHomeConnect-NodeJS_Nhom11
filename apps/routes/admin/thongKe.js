const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/thongKeController');

// VIEWS
router.get('/', ctrl.renderDashboard);
router.get('/doanh-thu', ctrl.renderDoanhThu);
router.get('/hop-dong', ctrl.renderHopDong);
router.get('/can-ho', ctrl.renderCanHo);

// APIs
router.get('/api/dashboard', ctrl.apiGetDashboard);
router.get('/api/doanh-thu', ctrl.apiGetDoanhThu);
router.get('/api/hop-dong', ctrl.apiGetHopDong);
router.get('/api/can-ho', ctrl.apiGetCanHo);

module.exports = router;