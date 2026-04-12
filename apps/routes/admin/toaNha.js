// apps/routes/admin/toaNha.js
const express = require('express');
const router = express.Router();
const toaNhaController = require('../../controllers/admin/toaNhaController');

router.get('/', toaNhaController.renderList);
router.get('/add', toaNhaController.renderAddForm);
router.post('/add', toaNhaController.processAdd);
router.get('/display/:id', toaNhaController.renderDisplay);
router.get('/update/:id', toaNhaController.renderUpdateForm);
router.post('/update/:id', toaNhaController.processUpdate);
router.get('/delete/:id', toaNhaController.renderDeleteConfirm);
router.post('/delete/:id', toaNhaController.processDelete);

router.post('/delete-multiple', toaNhaController.processBulkDelete);
router.post('/update-status-batch', toaNhaController.processBulkStatus);

router.get('/search-suggestions', toaNhaController.apiSearchSuggestions);
router.post('/change-status/:id', toaNhaController.apiToggleStatus);

module.exports = router;