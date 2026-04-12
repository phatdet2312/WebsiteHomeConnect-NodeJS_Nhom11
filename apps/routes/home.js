// app/routes/home.js
const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const { isCustomer } = require('../middleware/auth'); 

// Views & Forms
router.get('/', homeController.renderIndex);
router.get('/lien-he', homeController.renderLienHe);
router.post('/lien-he', homeController.submitLienHe);
router.get('/dich-vu', homeController.renderDichVu);
router.get('/thanh-toan-hop-dong', isCustomer, homeController.renderThanhToanHD);
router.get('/bao-loi', homeController.renderBaoLoi);
router.get('/privacy', homeController.renderPrivacy);

// JSON APIs
router.get('/api/home', homeController.apiGetHome);
router.get('/api/can-ho-noi-bat', homeController.apiGetFeatured);
router.get('/api/banner-thong-bao', homeController.apiGetBanners);
router.get('/api/search-suggestions', homeController.apiGetSearchSuggestions);
router.post('/api/chat-gemini', homeController.apiChatGemini);
router.post('/keep-alive', homeController.apiKeepAlive);

module.exports = router;