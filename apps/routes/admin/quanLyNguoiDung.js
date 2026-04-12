// apps/routes/admin/quanLyNguoiDung.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/quanLyNguoiDungController');

router.get('/', ctrl.renderIndex);
router.get('/phan-quyen', ctrl.renderPhanQuyen);
router.get('/phan-quyen/:userId', ctrl.renderChiTiet);

router.get('/api/list', ctrl.apiGetList);
router.get('/api/suggestions', ctrl.apiGetSuggestions);
router.get('/api/detail/:userId', ctrl.apiGetDetail);

router.post('/api/change-status/:userId', ctrl.apiChangeStatus);
router.post('/api/update-roles', ctrl.apiUpdateRoles);
router.post('/api/bulk-action', ctrl.apiBulkAction);

module.exports = router;