// apps/routes/admin/tang.js
const express = require('express');
const router = express.Router();
const tangController = require('../../controllers/admin/tangController');

router.get('/', tangController.renderList);
router.get('/add', tangController.renderAddForm);
router.post('/add', tangController.processAdd);
router.get('/display/:id', tangController.renderDisplay);
router.get('/update/:id', tangController.renderUpdateForm);
router.post('/update/:id', tangController.processUpdate);
router.get('/delete/:id', tangController.renderDeleteConfirm);
router.post('/delete/:id', tangController.processDelete);

router.post('/delete-multiple', tangController.processBulkDelete);
router.post('/update-status-batch', tangController.processBulkStatus);

router.get('/search-suggestions', tangController.apiSearchSuggestions);
router.post('/change-status/:id', tangController.apiToggleStatus);

module.exports = router;