// apps/routes/api.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// GET /api/home - home page data
router.get('/home', async (req, res) => {
  try {
    const { BannerQuangCao, CanHo, Tang, ToaNha, DSA_CanHo, DichVu } = require('../models');
    const [banners, featuredCanHo, dichVus] = await Promise.all([
      BannerQuangCao.findAll({ where: { TTHienThi: true }, order: [['MaBQC','ASC']] }),
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

// GET /api/kham-pha?search&minGia&maxGia&maToaNha&loai&page
router.get('/kham-pha', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT, DSA_CanHo } = require('../models');
    const { search, minGia, maxGia, maToaNha, loai, page = 1 } = req.query;
    const limit = 12;
    const offset = (parseInt(page) - 1) * limit;
    const where = { TTHienThi: true };
    if (search) where[Op.or] = [{ TenCanHo: { [Op.like]: `%${search}%` } }, { MoTa: { [Op.like]: `%${search}%` } }];
    if (minGia) where.Gia = { ...(where.Gia || {}), [Op.gte]: parseInt(minGia) };
    if (maxGia) where.Gia = { ...(where.Gia || {}), [Op.lte]: parseInt(maxGia) };
    if (loai === 'mua') where.Gia = { [Op.ne]: null };
    if (loai === 'thue') where.GiaThue = { [Op.ne]: null };
    const tangWhere = maToaNha ? { MaToaNha: maToaNha } : {};
    const { count, rows } = await CanHo.findAndCountAll({
      where, limit, offset,
      include: [
        { model: Tang, as: 'Tang', where: Object.keys(tangWhere).length ? tangWhere : undefined, include: [{ model: ToaNha, as: 'ToaNha' }] },
        { model: HienTrang, as: 'HienTrang', required: false },
        { model: TTTTvaMucTT, as: 'TTTTvaMucTT', required: false },
        { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
      ],
      order: [['TTDeXuat','DESC'],['MaCanHo','DESC']],
      subQuery: false
    });
    const toaNhas = await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha','ASC']] });
    res.json({ canHos: rows, toaNhas, total: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/can-ho/:id - apartment detail
router.get('/can-ho/:id', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT, DSA_CanHo, Phong, DSA_Phong, CT_NoiThat, NoiThat, DanhMucNoiThat, CT_DichVu, DichVu } = require('../models');
    const canHo = await CanHo.findOne({
      where: { MaCanHo: req.params.id, TTHienThi: true },
      include: [
        { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
        { model: HienTrang, as: 'HienTrang' },
        { model: TTTTvaMucTT, as: 'TTTTvaMucTT' },
        { model: DSA_CanHo, as: 'DSA_CanHos' },
        { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
        { model: CT_NoiThat, as: 'CT_NoiThats', include: [
          { model: NoiThat, as: 'NoiThat', include: [{ model: DanhMucNoiThat, as: 'DanhMucNoiThat' }] },
          { model: HienTrang, as: 'HienTrangCT' }
        ]},
        { model: CT_DichVu, as: 'CT_DichVus', include: [{ model: DichVu, as: 'DichVu' }] }
      ]
    });
    if (!canHo) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(canHo);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/search-suggestions?q=
router.get('/search-suggestions', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha } = require('../models');
    const q = req.query.q;
    if (!q) return res.json([]);
    const results = await CanHo.findAll({
      where: { TenCanHo: { [Op.like]: `%${q}%` }, TTHienThi: true },
      include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }],
      limit: 8
    });
    res.json(results.map(c => ({
      id: c.MaCanHo, ten: c.TenCanHo,
      tang: c.Tang ? c.Tang.TenTang : '', toaNha: c.Tang && c.Tang.ToaNha ? c.Tang.ToaNha.TenToaNha : ''
    })));
  } catch (err) { res.json([]); }
});

// GET /api/toa-nha - list buildings
router.get('/toa-nha', async (req, res) => {
  try {
    const { ToaNha } = require('../models');
    const list = await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha','ASC']] });
    res.json(list);
  } catch (err) { res.json([]); }
});

// GET /api/pttt - payment methods
router.get('/pttt', async (req, res) => {
  try {
    const { PTTT } = require('../models');
    const list = await PTTT.findAll({ order: [['TenPT','ASC']] });
    res.json(list);
  } catch (err) { res.json([]); }
});

// ── Auth-required endpoints ──

function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Chưa đăng nhập' });
  next();
}
function requireCustomer(req, res, next) {
  if (!req.isAuthenticated() || !req.user.dataValues.KhachHang) return res.status(401).json({ error: 'Không có quyền' });
  next();
}

// GET /api/my-contracts - user's contracts
router.get('/my-contracts', requireCustomer, async (req, res) => {
  try {
    const { HopDong, CanHo, Tang, ToaNha, LoaiHopDong, DSA_CanHo } = require('../models');
    const maKH = req.user.dataValues.KhachHang.MaKH;
    const hopDongs = await HopDong.findAll({
      where: { MaKH: maKH },
      include: [
        { model: CanHo, as: 'CanHo', include: [
          { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
          { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
        ]},
        { model: LoaiHopDong, as: 'LoaiHopDong' }
      ],
      order: [['MaHopDong','DESC']]
    });
    res.json(hopDongs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/my-contracts/:id - contract detail
router.get('/my-contracts/:id', requireCustomer, async (req, res) => {
  try {
    const { HopDong, CanHo, Tang, ToaNha, LoaiHopDong, NhanVien, DSA_CanHo, Phong, DSA_Phong, CT_NoiThat, NoiThat, DanhMucNoiThat, HienTrang, CT_DichVu, DichVu } = require('../models');
    const maKH = req.user.dataValues.KhachHang.MaKH;
    const hopDong = await HopDong.findOne({
      where: { MaHopDong: req.params.id, MaKH: maKH },
      include: [
        { model: CanHo, as: 'CanHo', include: [
          { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
          { model: DSA_CanHo, as: 'DSA_CanHos' },
          { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
          { model: HienTrang, as: 'HienTrang' },
          { model: CT_NoiThat, as: 'CT_NoiThats', include: [
            { model: NoiThat, as: 'NoiThat', include: [{ model: DanhMucNoiThat, as: 'DanhMucNoiThat' }] },
            { model: HienTrang, as: 'HienTrangCT' }
          ]},
          { model: CT_DichVu, as: 'CT_DichVus', include: [{ model: DichVu, as: 'DichVu' }] }
        ]},
        { model: LoaiHopDong, as: 'LoaiHopDong' },
        { model: NhanVien, as: 'NhanVien' }
      ]
    });
    if (!hopDong) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(hopDong);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/gio-hang - cart items
router.get('/gio-hang', requireAuth, async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, DSA_CanHo } = require('../models');
    const cartSession = req.session.cart || [];
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

// GET /api/thanh-toan-items - items in cart for purchase/rent payment
router.get('/thanh-toan-items', requireAuth, async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, DSA_CanHo, PTTT } = require('../models');
    const cartSession = req.session.cart || [];
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

// GET /api/quan-ly-lich - calendar data
router.get('/quan-ly-lich', requireCustomer, async (req, res) => {
  try {
    const { Lich, SuKien } = require('../models');
    const maKH = req.user.dataValues.KhachHang.MaKH;
    const lichs = await Lich.findAll({
      where: { MaKH: maKH },
      include: [{ model: SuKien, as: 'SuKiens' }]
    });
    res.json(lichs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
