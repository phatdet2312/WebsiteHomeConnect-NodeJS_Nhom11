const express = require('express');
const router = express.Router();
const { uploadLoaiTTHD } = require('../../middleware/upload');
const ctrl = require('../../controllers/admin/loaiTTHDController');

router.get('/', ctrl.renderList);
router.get('/add', ctrl.renderAddForm);
router.post('/add', uploadLoaiTTHD, ctrl.processAdd);
router.get('/display/:id', ctrl.renderDisplay);
router.get('/update/:id', ctrl.renderUpdateForm);
router.post('/update/:id', uploadLoaiTTHD, ctrl.processUpdate);
router.get('/delete/:id', ctrl.renderDeleteConfirm);
router.post('/delete/:id', ctrl.processDelete);
router.post('/delete-multiple', ctrl.processBulkDelete);
router.post('/update-status-batch', ctrl.processBulkStatus);
router.get('/search-suggestions', ctrl.apiSearchSuggestions);
router.post('/change-status/:id', ctrl.apiToggleStatus);

module.exports = router;