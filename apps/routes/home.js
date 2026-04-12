// app/routes/home.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { isCustomer } = require('../middleware/auth'); 

// GET / - Homepage
router.get('/', (_req, res) => {
  res.render('home/index', { title: 'HomeConnect - Hệ thống quản lý căn hộ', layout: 'layouts/main' });
});

// GET /lien-he
router.get('/lien-he', (req, res) => {
  res.render('home/lienHe', { title: 'Liên hệ - HomeConnect', layout: 'layouts/main', sent: false });
});

// POST /lien-he
router.post('/lien-he', async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const { HoTen, Email, SDT, TieuDe, NoiDung } = req.body;
    await emailService.sendContactEmail({ name: HoTen, email: Email, phone: SDT, subject: TieuDe, message: NoiDung });
    res.render('home/lienHe', { title: 'Liên hệ - HomeConnect', layout: 'layouts/main', sent: true });
  } catch (err) {
    res.render('home/lienHe', { title: 'Liên hệ', layout: 'layouts/main', sent: false, error: err.message });
  }
});

// GET /dich-vu 
router.get('/dich-vu', (_req, res) => {
  res.render('home/dichVu', { title: 'Dịch vụ - HomeConnect', layout: 'layouts/main' });
});

// GET /thanh-toan-hop-dong
router.get('/thanh-toan-hop-dong', isCustomer, (_req, res) => {
  res.render('home/thanhToanHopDong', { title: 'Hợp Đồng & Thanh Toán', layout: 'layouts/main' });
});

// ==========================================
// CÁC API CỦA TRANG CHỦ TRƯỚC ĐÂY NẰM Ở api.js
// ==========================================

// GET /api/home - data cho trang chủ
router.get('/api/home', async (req, res) => {
  try {
    const { BannerQuangCao, CanHo, Tang, ToaNha, DSA_CanHo, DichVu } = require('../models');
    const [banners, featuredCanHo, dichVus] = await Promise.all([
      BannerQuangCao.findAll({ where: { TTHienThi: true }, order: [['MaAQC','ASC']] }),
      CanHo.findAll({
        where: { TTHienThi: true, TTDeXuat: true },
        include: [
          { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
          { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
        ],
        limit: 6, order: [['MaCanHo','DESC']]
      }),
      DichVu.findAll({ where: { TTHienThi: true }, limit: 6 })
    ]);
    res.json({ banners, featuredCanHo, dichVus });
  } catch (err) { res.json({ banners: [], featuredCanHo: [], dichVus: [] }); }
});

router.get('/api/can-ho-noi-bat', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, DSA_CanHo } = require('../models');
    const list = await CanHo.findAll({
      where: { TTHienThi: true, TTDeXuat: true },
      include: [
        { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
        { model: DSA_CanHo, as: 'DSA_CanHos', limit: 3 }
      ],
      limit: 8,
      order: [['MaCanHo','DESC']]
    });
    res.json(list);
  } catch (err) { res.json([]); }
});

router.get('/api/banner-thong-bao', async (req, res) => {
  try {
    const { BannerQuangCao } = require('../models');
    const list = await BannerQuangCao.findAll({ where: { TTHienThi: true }, limit: 10, order: [['MaAQC','DESC']] });
    res.json(list);
  } catch (err) { res.json([]); }
});

router.get('/api/search-suggestions', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha } = require('../models');
    const q = req.query.q || '';
    if (!q) return res.json([]);
    const list = await CanHo.findAll({
      where: { [Op.or]: [{ TenCanHo: { [Op.like]: `%${q}%` } }, { MoTa: { [Op.like]: `%${q}%` } }], TTHienThi: true },
      include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }],
      limit: 10
    });
    res.json(list.map(c => ({ id: c.MaCanHo, ten: c.TenCanHo, tang: c.Tang?.TenTang, toaNha: c.Tang?.ToaNha?.TenToaNha })));
  } catch (err) { res.json([]); }
});

// POST /api/chat-gemini
router.post('/api/chat-gemini', async (req, res) => {
  try {
    const gemini = require('../services/geminiService');
    const { message, context } = req.body;
    const reply = await gemini.chat(message, context);
    res.json({ success: true, message: reply });
  } catch (err) {
    res.json({ success: false, message: 'Xin lỗi, AI hiện không khả dụng: ' + err.message });
  }
});

// GET /bao-loi
router.get('/bao-loi', (req, res) => {
  res.render('errors/access-denied', { title: 'Không có quyền truy cập', layout: 'layouts/main' });
});

// GET /privacy
router.get('/privacy', (req, res) => {
  res.render('home/privacy', { title: 'Chính sách bảo mật', layout: 'layouts/main' });
});

// POST /keep-alive
router.post('/keep-alive', (req, res) => res.json({ alive: true }));

module.exports = router;