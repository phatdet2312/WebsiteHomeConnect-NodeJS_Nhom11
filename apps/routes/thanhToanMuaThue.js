// apps/routes/thanhToanMuaThue.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const vnpay = require('../services/vnpayService');

router.use(isAuthenticated);

router.get('/', (_req, res) => {
  res.render('thanhToanMuaThue/index', { title: 'Thanh toán mua/thuê căn hộ', layout: 'layouts/main' });
}); 

router.post('/xac-nhan', async (req, res) => {
  try {
    const { HopDong, CanHo } = require('../models');
    const maKH = req.user.dataValues.KhachHang?.MaKH;
    const { MaPT, items, paymentMethod } = req.body;
    const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

    if (paymentMethod === 'vnpay') {
      const total = parsedItems.reduce((sum, i) => sum + (i.Gia || 0), 0);
      const txnRef = 'MUA' + Date.now();
      req.session.vnpayPending = { type: 'muaThue', maKH, MaPT, items: parsedItems, txnRef };
      const url = vnpay.createPaymentUrl(req, {
        amount: total, orderInfo: 'Thanh toan can ho HomeConnect',
        txnRef, returnUrl: process.env.BASE_URL + '/thanh-toan-mua-thue/callback-vnpay'
      });
      return res.json({ success: true, redirect: url });
    }

    // Create contracts for each item
    for (const item of parsedItems) {
      const canHo = await CanHo.findByPk(item.MaCanHo);
      if (!canHo) continue;
      await HopDong.create({
        MaKH: maKH,
        MaCanHo: item.MaCanHo,
        MaLoaiHD: item.loai === 'mua' ? 1 : 2,
        MaVaiTroHD: 1,
        GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
        GiaThoaThuan: item.Gia,
        NgayLap: new Date(),
        TrangThaiHD: null
      });
    }
    req.session.cart = [];
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

router.get('/callback-vnpay', async (req, res) => {
  try {
    const { HopDong, CanHo } = require('../models');
    const result = vnpay.verifyCallback(req.query);
    const pending = req.session.vnpayPending;

    if (result.isValid && result.responseCode === '00' && pending && pending.type === 'muaThue') {
      // Create contracts from pending session data (same logic as direct payment)
      for (const item of (pending.items || [])) {
        const canHo = await CanHo.findByPk(item.MaCanHo);
        if (!canHo) continue;
        await HopDong.create({
          MaKH: pending.maKH,
          MaCanHo: item.MaCanHo,
          MaLoaiHD: item.loai === 'mua' ? 1 : 2,
          MaVaiTroHD: 1,
          GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
          GiaThoaThuan: item.Gia,
          NgayLap: new Date(),
          TrangThaiHD: null
        });
      }
      delete req.session.vnpayPending;
      req.session.cart = [];
      return res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: true, result });
    }
    res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, result });
  } catch (err) {
    res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, error: err.message });
  }
});

module.exports = router;
