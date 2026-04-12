//apps/routes/quanLyLich.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');
const ctrl = require('../controllers/quanLyLichController');

router.use(isCustomer);

router.get('/', ctrl.renderIndex);

// Lịch
router.get('/api/lich', ctrl.apiGetLichs);
router.post('/api/lich', ctrl.apiCreateLich);
router.put('/api/lich/:id', ctrl.apiUpdateLich);
router.delete('/api/lich/:id', ctrl.apiDeleteLich);

// Sự kiện
router.get('/api/su-kien', ctrl.apiGetEvents);
router.post('/api/su-kien', ctrl.apiCreateEvent);
router.put('/api/su-kien/:id', ctrl.apiUpdateEvent);
router.delete('/api/su-kien/:id', ctrl.apiDeleteEvent);

module.exports = router;

