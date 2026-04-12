// apps/routes/admin/index.js
const express = require('express');
const router = express.Router();
const { isAdminOrEmployee } = require('../../middleware/auth');
const dashboardController = require('../../controllers/admin/dashboardController');

router.use(isAdminOrEmployee);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', dashboardController.renderDashboard);

router.use('/banner', require('./banner'));
router.use('/toa-nha', require('./toaNha'));
router.use('/tang', require('./tang'));
router.use('/can-ho', require('./canho'));
router.use('/danh-muc-noi-that', require('./danhMucNoiThat'));
router.use('/hien-trang', require('./hienTrang'));
router.use('/dich-vu', require('./dichVu'));
router.use('/ct-dich-vu', require('./ctDichVu'));
router.use('/hop-dong', require('./hopDong'));
router.use('/ct-thanh-toan', require('./ctThanhToan'));
router.use('/loai-tt-hd', require('./loaiTTHD'));
router.use('/pttt', require('./pttt'));
router.use('/trang-thai', require('./trangThai'));
router.use('/tttt-muc-tt', require('./ttttVaMucTT'));
router.use('/quan-ly-nguoi-dung', require('./quanLyNguoiDung'));
router.use('/thong-ke', require('./thongKe'));

module.exports = router;