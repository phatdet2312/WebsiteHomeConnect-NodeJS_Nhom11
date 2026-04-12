const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/ctThanhToanController');

router.get('/', ctrl.renderIndex);
router.get('/chi-tiet/:id', ctrl.renderChiTiet);

router.get('/api/services', ctrl.apiGetServices);
router.get('/api/workspace-data/:maLoaiTT', ctrl.apiGetWorkspaceData);
router.get('/api/metadata', ctrl.apiGetMetadata);
router.get('/api/lay-tang', ctrl.apiGetTangs);
router.get('/api/lay-can-ho', ctrl.apiGetCanHos);

router.post('/api/gan-ky-hang-loat', ctrl.apiGanKyHangLoat);
router.post('/api/cap-nhat-inline', ctrl.apiCapNhatInline);
router.post('/api/xoa-ct', ctrl.apiXoaCT);
router.post('/api/ky/thao-tac', ctrl.apiKyThaoTac);

router.get('/api/chi-tiet-thanh-toan', ctrl.apiChiTietThanhToan);
router.post('/api/cap-nhat-trang-thai-hoa-don', ctrl.apiCapNhatTrangThai);

module.exports = router;