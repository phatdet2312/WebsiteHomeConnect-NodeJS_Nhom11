// apps/routes/shoppingCart.js
const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Hàm hỗ trợ lưu Giỏ hàng qua Cookie
const getCart = (req) => {
  try { return req.cookies.cart ? JSON.parse(req.cookies.cart) : []; }
  catch(e) { return []; }
};
const saveCart = (res, cart) => {
  res.cookie('cart', JSON.stringify(cart), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
};

router.get('/', (_req, res) => {
  res.render('shoppingCart/index', { title: 'Giỏ hàng - HomeConnect', layout: 'layouts/main' });
});

router.get('/api/list', isAuthenticated, async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, DSA_CanHo } = require('../models');
    const cartSession = getCart(req); // ĐÃ FIX
    if (cartSession.length === 0) return res.json([]);
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
    res.json(cart);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/add', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha } = require('../models');
    const { maCanHo, loai } = req.body; 
    const canHo = await CanHo.findOne({
      where: { MaCanHo: maCanHo, TTHienThi: true },
      include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }]
    });
    if (!canHo) return res.json({ success: false, message: 'Căn hộ không tồn tại' });
    
    let cart = getCart(req); // ĐÃ FIX
    const exists = cart.find(i => (i.MaCanHo === parseInt(maCanHo) || i.maCanHo === parseInt(maCanHo)) && i.loai === loai);
    if (!exists) {
      cart.push({
        MaCanHo: canHo.MaCanHo, TenCanHo: canHo.TenCanHo,
        Gia: loai === 'mua' ? canHo.Gia : canHo.GiaThue,
        UrlAnh: canHo.UrlAnh, loai,
        Tang: canHo.Tang?.TenTang, ToaNha: canHo.Tang?.ToaNha?.TenToaNha
      });
      saveCart(res, cart); // ĐÃ FIX
    }
    res.json({ success: true, count: cart.length });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/remove', (req, res) => {
  const { maCanHo, loai } = req.body;
  let cart = getCart(req);
  cart = cart.filter(i => !((i.MaCanHo === parseInt(maCanHo) || i.maCanHo === parseInt(maCanHo)) && i.loai === loai));
  saveCart(res, cart);
  res.json({ success: true, count: cart.length });
});

router.post('/remove-selected', (req, res) => {
  const { items } = req.body; 
  let cart = getCart(req);
  if (items) {
    cart = cart.filter(c => !items.some(i => (i.maCanHo == c.MaCanHo || i.MaCanHo == c.MaCanHo) && i.loai === c.loai));
    saveCart(res, cart);
  }
  res.json({ success: true, count: cart.length });
});

router.get('/order-completed', (req, res) => {
  res.render('shoppingCart/orderCompleted', { title: 'Đặt hàng thành công', layout: 'layouts/main' });
});

module.exports = router;