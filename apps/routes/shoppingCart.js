// apps/routes/shoppingCart.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', cartController.renderIndex);
router.get('/order-completed', cartController.renderOrderCompleted);

// APIs
router.get('/api/list', isAuthenticated, cartController.apiGetList);
router.post('/add', cartController.apiAdd);
router.post('/remove', cartController.apiRemove);
router.post('/remove-selected', cartController.apiRemoveSelected);

module.exports = router;