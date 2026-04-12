// apps/routes/canho.js
const express = require('express');
const router = express.Router();
const { isCustomer } = require('../middleware/auth');

router.use(isCustomer);

// GET / - Apartment list for customer
router.get('/', (_req, res) => {
  res.render('canho/index', { title: 'Căn hộ của tôi', layout: 'layouts/main' });
});

// GET /chi-tiet/:maHopDong
router.get('/chi-tiet/:maHopDong', (_req, res) => {
  res.render('canho/chiTiet', { title: 'Chi tiết hợp đồng', layout: 'layouts/main' });
});

// ==========================================
// API CĂN HỘ CỦA TÔI
// ==========================================

// GET /can-ho/api/my-contracts - user's contracts
router.get('/api/my-contracts', async (req, res) => {
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

// GET /can-ho/api/my-contracts/:id - contract detail
router.get('/api/my-contracts/:id', async (req, res) => {
  try {
    const { HopDong, CanHo, Tang, ToaNha, LoaiHopDong, NhanVien, DSA_CanHo, Phong, DSA_Phong, CT_NoiThat, NoiThat, DanhMucNoiThat, HienTrang, CT_DichVu, DichVu, VaiTroHD, KhachHang } = require('../models');
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
        { model: NhanVien, as: 'NhanVien' },
        // ĐÃ BỔ SUNG LẤY THÔNG TIN VAI TRÒ VÀ KHÁCH HÀNG:
        { model: VaiTroHD, as: 'VaiTroHD' },
        { model: KhachHang, as: 'KhachHang' }
      ]
    });
    if (!hopDong) return res.status(404).json({ error: 'Không tìm thấy' });
    res.json(hopDong);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;