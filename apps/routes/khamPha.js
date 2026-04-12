// apps/routes/khamPha.js
const express = require('express');
const router = express.Router();
const khamPhaController = require('../controllers/khamPhaController');

router.get('/', khamPhaController.renderIndex);
router.get('/api/list', khamPhaController.apiGetList);

module.exports = router;