// apps/routes/auth.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

// --- RENDER VIEWS ---
router.get('/login', authController.renderLogin);
router.get('/register', authController.renderRegister);
router.get('/change-password', authController.renderChangePassword);

// --- APIs ---
router.post('/api/login', authController.apiLogin);
router.get('/logout', authController.apiLogout);

// --- GOOGLE OAUTH ---
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', authController.googleCallback);

// --- REGISTER PROCESS ---
router.post('/api/register/send-code', authController.apiSendRegisterCode);
router.post('/api/register/verify-code', authController.apiVerifyRegisterCode);

// --- CHANGE PASSWORD ---
router.post('/api/change-password', authController.apiChangePassword);

module.exports = router;