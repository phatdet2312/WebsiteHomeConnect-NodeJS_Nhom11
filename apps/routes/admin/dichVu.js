const express = require('express');
const router = express.Router();
const { uploadDichVu } = require('../../middleware/upload');
const ctrl = require('../../controllers/admin/dichVuController');

router.get('/', ctrl.renderIndex);
router.get('/add', ctrl.renderAdd);
router.get('/update/:id', ctrl.renderUpdate);
router.get('/display/:id', ctrl.renderDisplay);

router.get('/api/list', ctrl.apiGetList);
router.get('/api/suggestions', ctrl.apiGetSuggestions);
router.get('/api/detail/:id', ctrl.apiGetDetail);
router.post('/api/add', uploadDichVu, ctrl.apiCreate);
router.post('/api/update/:id', uploadDichVu, ctrl.apiUpdate);
router.post('/api/delete/:id', ctrl.apiDelete);
router.post('/api/change-status/:id', ctrl.apiChangeStatus);
router.post('/api/delete-multiple', ctrl.apiDeleteMultiple);
router.post('/api/update-status-batch', ctrl.apiUpdateStatusBatch);

module.exports = router;