// apps/routes/admin/index.js
const express = require('express');
const router = express.Router();
const { isAdminOrEmployee } = require('../../middleware/auth');

router.use(isAdminOrEmployee);

router.get('/', (req, res) => res.redirect('/admin/dashboard'));

router.get('/dashboard', async (req, res) => {
  try {
    const { KhachHang, CanHo, HopDong, DichVu, ToaNha, BannerQuangCao, sequelize } = require('../../models');
    const [tongKH, tongCanHo, tongHD, tongDV, tongToaNha, canHoTrong, hdChoDuyet, tongBanner] = await Promise.all([
      KhachHang.count(),
      CanHo.count({ where: { TTHienThi: true } }),
      HopDong.count({ where: { TrangThaiHD: true } }),
      DichVu.count({ where: { TTHienThi: true } }),
      ToaNha.count(),
      CanHo.count({ where: { TTHienThi: true, TTDeXuat: false } }),
      HopDong.count({ where: { TrangThaiHD: null } }),
      BannerQuangCao.count({ where: { TTHienThi: true } })
    ]);

    const [recentHopDongRaw, recentCanHoRaw] = await Promise.all([
      HopDong.findAll({
        limit: 5,
        order: [['MaHopDong', 'DESC']],
        include: [{ model: KhachHang, as: 'KhachHang', attributes: ['TenKH'] }]
      }),
      CanHo.findAll({ limit: 5, order: [['MaCanHo', 'DESC']], attributes: ['MaCanHo', 'TenCanHo', 'Gia'] })
    ]);

    const recentHopDong = recentHopDongRaw.map(hd => ({
      MaHD: hd.MaHopDong,
      HoTen: hd.KhachHang ? hd.KhachHang.TenKH : `KH#${hd.MaKH}`,
      MaKH: hd.MaKH,
      TTHopDong: hd.TrangThaiHD
    }));
    const recentCanHo = recentCanHoRaw.map(c => ({
      MaCanHo: c.MaCanHo,
      TenCanHo: c.TenCanHo,
      GiaBan: c.Gia
    }));

    res.render('admin/dashboard', {
      title: 'Bảng điều khiển Admin',
      layout: 'layouts/admin',
      stats: { tongKH, tongCanHo, tongHD, tongDV, tongToaNha, canHoTrong, hdChoDuyet, tongBanner },
      recentHopDong,
      recentCanHo
    });
  } catch (err) {
    console.error(err);
    res.render('admin/dashboard', {
      title: 'Dashboard',
      layout: 'layouts/admin',
      stats: { tongKH: 0, tongCanHo: 0, tongHD: 0, tongDV: 0, tongToaNha: 0, canHoTrong: 0, hdChoDuyet: 0, tongBanner: 0 },
      recentHopDong: [],
      recentCanHo: []
    });
  }
});
 
router.use('/banner', require('./banner'));
router.use('/quan-ly-nguoi-dung', require('./quanLyNguoiDung'));
router.use('/dich-vu', require('./dichVu'));
router.use('/ct-dich-vu', require('./ctDichVu'));
router.use('/toa-nha', require('./toaNha'));
router.use('/tang', require('./tang'));
router.use('/can-ho', require('./canho'));
router.use('/danh-muc-noi-that', require('./danhMucNoiThat'));
router.use('/hien-trang', require('./hienTrang'));
router.use('/hop-dong', require('./hopDong'));
router.use('/ct-thanh-toan', require('./ctThanhToan'));
router.use('/loai-tt-hd', require('./loaiTTHD'));
router.use('/pttt', require('./pttt'));
router.use('/trang-thai', require('./trangThai'));
router.use('/tttt-muc-tt', require('./ttttVaMucTT'));

module.exports = router;
