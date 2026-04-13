// apps/routes/admin/hopDong.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ctrl = require('../../controllers/admin/hopDongController');

// Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'urlAnhHD' ? 'anhhopdong' : 'dsanhhopdong';
    const dir = path.join(__dirname, '../../../../public/images', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => { cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname)); }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).fields([
  { name: 'urlAnhHD', maxCount: 1 }, { name: 'additionalImages', maxCount: 30 }
]);

router.get('/', ctrl.renderIndex);
router.get('/add', ctrl.renderAdd);
router.get('/update/:id', ctrl.renderUpdate);
router.get('/display/:id', ctrl.renderDisplay);

router.get('/api/form-data', ctrl.apiGetFormData);
router.get('/api/list', ctrl.apiGetList);
router.get('/api/suggestions', ctrl.apiGetSuggestions);
router.get('/api/detail/:id', ctrl.apiGetDetail);
router.post('/api/add', upload, ctrl.apiCreate);
router.post('/api/update/:id', upload, ctrl.apiUpdate);
router.post('/api/delete-multiple', ctrl.apiDeleteMultiple);
router.post('/api/change-status/:id', ctrl.apiChangeStatus);
router.post('/api/update-status-batch', ctrl.apiUpdateStatusBatch);

module.exports = router;