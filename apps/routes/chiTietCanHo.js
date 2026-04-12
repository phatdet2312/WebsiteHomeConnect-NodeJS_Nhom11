// apps/routes/chiTietCanHo.js
const express = require('express');
const router = express.Router();

// GET /:id - Public apartment detail page
router.get('/:id', (_req, res) => {
  res.render('chiTietCanHo/index', { title: 'Chi tiết căn hộ - HomeConnect', layout: 'layouts/main' });
});

// ==========================================
// CÁC API CHI TIẾT CĂN HỘ TRƯỚC ĐÂY NẰM Ở api.js
// ==========================================

// GET /chi-tiet-can-ho/api/data/:id - data apartment detail
router.get('/api/data/:id', async (req, res) => {
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

module.exports = router;