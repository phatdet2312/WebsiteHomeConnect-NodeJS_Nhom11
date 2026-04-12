//apps/routes/admin/canho.js
const express = require('express');
const router = express.Router();
const ctrl = require('../../controllers/admin/adminCanHoController');
const path = require('path');
const fs = require('fs');
const multer = require('multer');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'anhchinhcanho';
    if (file.fieldname === 'additionalImages') folder = 'dsanhcanho';
    if (file.fieldname.startsWith('AnhPhong_')) folder = 'dsanhphong';
    const dir = path.join(__dirname, '../../../../public/images', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)); }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).any();

// Giao diện
router.get('/', ctrl.renderIndex);
router.get('/add', ctrl.renderAdd);
router.get('/update/:id', ctrl.renderUpdate);
router.get('/display/:id', ctrl.renderDisplay);

// API JSON
router.get('/api/metadata', ctrl.apiGetMetadata);
router.get('/api/list', ctrl.apiGetList);
router.get('/api/suggestions', ctrl.apiGetSuggestions);
router.get('/api/detail/:id', ctrl.apiGetDetail);
router.post('/api/add', upload, ctrl.apiCreate);
router.post('/api/update/:id', upload, ctrl.apiUpdate);
router.post('/api/delete-multiple', ctrl.apiDeleteMultiple);
router.post('/api/change-status/:id', ctrl.apiChangeStatus);
router.post('/api/bulk-update', ctrl.apiBulkUpdate);

module.exports = router;