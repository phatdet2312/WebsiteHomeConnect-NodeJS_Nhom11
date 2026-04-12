// apps/routes/shoppingCart.js
const express = require('express');
const router = express.Router();

// Shopping cart
router.get('/', (_req, res) => {
  res.render('shoppingCart/index', { title: 'Giỏ hàng - HomeConnect', layout: 'layouts/main' });
});
 
router.post('/add', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha } = require('../models');
    const { maCanHo, loai } = req.body; // loai: 'mua' | 'thue'
    const canHo = await CanHo.findOne({
      where: { MaCanHo: maCanHo, TTHienThi: true },
      include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }]
    });
    if (!canHo) return res.json({ success: false, message: 'Căn hộ không tồn tại' });
    if (!req.session.cart) req.session.cart = [];
    const exists = req.session.cart.find(i => i.MaCanHo === parseInt(maCanHo) && i.loai === loai);
    if (!exists) {
      req.session.cart.push({
        MaCanHo: canHo.MaCanHo, TenCanHo: canHo.TenCanHo,
        Gia: loai === 'mua' ? canHo.Gia : canHo.GiaThue,
        UrlAnh: canHo.UrlAnh, loai,
        Tang: canHo.Tang?.TenTang, ToaNha: canHo.Tang?.ToaNha?.TenToaNha
      });
    }
    res.json({ success: true, count: req.session.cart.length });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

router.post('/remove', (req, res) => {
  const { maCanHo, loai } = req.body;
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(i => !(i.MaCanHo === parseInt(maCanHo) && i.loai === loai));
  }
  res.json({ success: true, count: (req.session.cart || []).length });
});

router.post('/remove-selected', (req, res) => {
  const { items } = req.body; // array of {maCanHo, loai}
  if (req.session.cart && items) {
    req.session.cart = req.session.cart.filter(c =>
      !items.some(i => i.maCanHo == c.MaCanHo && i.loai === c.loai)
    );
  }
  res.json({ success: true, count: (req.session.cart || []).length });
});

router.get('/order-completed', (req, res) => {
  res.render('shoppingCart/orderCompleted', { title: 'Đặt hàng thành công', layout: 'layouts/main' });
});

module.exports = router;
