// apps/routes/admin/banner.js
const express = require('express');
const router = express.Router();
const { uploadBanner } = require('../../middleware/upload');
const bannerController = require('../../controllers/admin/bannerController');

// Views & Forms
router.get('/', bannerController.renderList);
router.get('/add', bannerController.renderAddForm);
router.post('/add', uploadBanner, bannerController.processAdd);
router.get('/display/:id', bannerController.renderDisplay);
router.get('/update/:id', bannerController.renderUpdateForm);
router.post('/update/:id', uploadBanner, bannerController.processUpdate);
router.get('/delete/:id', bannerController.renderDeleteConfirm);
router.post('/delete/:id', bannerController.processDelete);
router.post('/delete-multiple', bannerController.processBulkDelete);
router.post('/update-status-batch', bannerController.processBulkStatus);

// JSON APIs
router.get('/search-suggestions', bannerController.apiSearchSuggestions);
router.post('/change-status/:id', bannerController.apiToggleStatus);

module.exports = router;