// apps/routes/admin/hienTrang.js
const express = require('express');
const router = express.Router();
const hienTrangController = require('../../controllers/admin/hienTrangController');

router.get('/', hienTrangController.renderList);
router.get('/add', hienTrangController.renderAddForm);
router.post('/add', hienTrangController.processAdd);
router.get('/display/:id', hienTrangController.renderDisplay);
router.get('/update/:id', hienTrangController.renderUpdateForm);
router.post('/update/:id', hienTrangController.processUpdate);
router.get('/delete/:id', hienTrangController.renderDeleteConfirm);
router.post('/delete/:id', hienTrangController.processDelete);

router.post('/delete-multiple', hienTrangController.processBulkDelete);
router.post('/update-status-batch', hienTrangController.processBulkStatus);

router.get('/search-suggestions', hienTrangController.apiSearchSuggestions);
router.post('/change-status/:id', hienTrangController.apiToggleStatus);

module.exports = router;