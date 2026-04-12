// apps/routes/thanhToanMuaThue.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const vnpay = require('../services/vnpayService');

// Hàm hỗ trợ Cookie
const getCart = (req) => { try { return req.cookies.cart ? JSON.parse(req.cookies.cart) : []; } catch(e) { return []; } };
const getPending = (req) => { try { return req.cookies.vnpayPending ? JSON.parse(req.cookies.vnpayPending) : null; } catch(e) { return null; } };

router.use(isAuthenticated);

router.get('/', (_req, res) => {
  res.render('thanhToanMuaThue/index', { title: 'Thanh toán mua/thuê căn hộ', layout: 'layouts/main' });
});

router.get('/api/items', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, DSA_CanHo, PTTT } = require('../models');
    const cartSession = getCart(req); // ĐÃ FIX
    const pttts = await PTTT.findAll({ order: [['TenPT','ASC']] });
    if (cartSession.length === 0) return res.json({ cart: [], pttts });
    
    const maCanHoList = [...new Set(cartSession.map(i => i.maCanHo || i.MaCanHo))];
    const canHos = await CanHo.findAll({
      where: { MaCanHo: maCanHoList },
      include: [
        { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
        { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
      ]
    });
    const cart = cartSession.map(item => {
      const maCanHo = item.maCanHo || item.MaCanHo;
      const ch = canHos.find(c => c.MaCanHo == maCanHo);
      if (!ch) return null;
      return {
        MaCanHo: ch.MaCanHo, TenCanHo: ch.TenCanHo,
        UrlAnh: ch.DSA_CanHos && ch.DSA_CanHos.length > 0 ? ch.DSA_CanHos[0].UrlAnh : null,
        Gia: item.loai === 'mua' ? ch.Gia : ch.GiaThue,
        ToaNha: ch.Tang && ch.Tang.ToaNha ? ch.Tang.ToaNha.TenToaNha : '',
        Tang: ch.Tang ? ch.Tang.TenTang : '',
        loai: item.loai
      };
    }).filter(Boolean);
    res.json({ cart, pttts });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
      
      // Lưu pending info vào Cookie thay vì Session (hết hạn trong 15p)
      const pendingData = { type: 'muaThue', maKH, MaPT, items: parsedItems, txnRef };
      res.cookie('vnpayPending', JSON.stringify(pendingData), { httpOnly: true, maxAge: 15 * 60 * 1000 });

      const url = vnpay.createPaymentUrl(req, {
        amount: total, orderInfo: 'Thanh toan can ho HomeConnect',
        txnRef, returnUrl: process.env.BASE_URL + '/thanh-toan-mua-thue/callback-vnpay'
      });
      return res.json({ success: true, redirect: url });
    }

    for (const item of parsedItems) {
      const canHo = await CanHo.findByPk(item.MaCanHo || item.maCanHo);
      if (!canHo) continue;
      await HopDong.create({
        MaKH: maKH, MaCanHo: canHo.MaCanHo, MaLoaiHD: item.loai === 'mua' ? 1 : 2,
        MaVaiTroHD: 1, GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
        GiaThoaThuan: item.Gia, NgayLap: new Date(), TrangThaiHD: null
      });
    }
    
    res.clearCookie('cart'); // Thanh toán xong xóa giỏ hàng
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/callback-vnpay', async (req, res) => {
  try {
    const { HopDong, CanHo } = require('../models');
    const result = vnpay.verifyCallback(req.query);
    const pending = getPending(req); // ĐÃ FIX

    if (result.isValid && result.responseCode === '00' && pending && pending.type === 'muaThue') {
      for (const item of (pending.items || [])) {
        const canHo = await CanHo.findByPk(item.MaCanHo || item.maCanHo);
        if (!canHo) continue;
        await HopDong.create({
          MaKH: pending.maKH, MaCanHo: canHo.MaCanHo, MaLoaiHD: item.loai === 'mua' ? 1 : 2,
          MaVaiTroHD: 1, GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
          GiaThoaThuan: item.Gia, NgayLap: new Date(), TrangThaiHD: null
        });
      }
      res.clearCookie('vnpayPending');
      res.clearCookie('cart');
      return res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: true, result });
    }
    res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, result });
  } catch (err) {
    res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, error: err.message });
  }
});

module.exports = router;