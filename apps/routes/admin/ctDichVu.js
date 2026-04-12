const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../../controllers/admin/ctDichVuController');

const uploadMinhChung = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(__dirname, '../../../../public/images/anhminhchung');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            cb(null, dir);
        },
        filename: (req, file, cb) => { cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)); }
    }),
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.get('/', ctrl.renderIndex);
router.get('/chi-tiet/:id', ctrl.renderChiTiet);

router.get('/api/services', ctrl.apiGetServices);
router.get('/api/workspace-data/:maDV', ctrl.apiGetWorkspaceData);
router.get('/api/metadata', ctrl.apiGetMetadata);
router.get('/api/lay-tang', ctrl.apiGetTangs);
router.get('/api/lay-can-ho', ctrl.apiGetCanHos);

router.post('/api/gan-ky-hang-loat', uploadMinhChung.array('anhMinhChung', 50), ctrl.apiGanKyHangLoat);
router.post('/api/cap-nhat-inline', ctrl.apiCapNhatInline);
router.post('/api/xoa-ct', ctrl.apiXoaCT);
router.post('/api/ky/thao-tac', ctrl.apiKyThaoTac);

router.get('/api/chi-tiet-thanh-toan', ctrl.apiChiTietThanhToan);
router.post('/api/cap-nhat-trang-thai-hoa-don', ctrl.apiCapNhatTrangThai);

module.exports = router;