// apps/routes/admin/thongKe.js
const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { KhachHang, CanHo, HopDong, DichVu, HD_HopDong, CT_HDHD, Tang, ToaNha } = require('../../models');
const { Op } = require('sequelize');

// GET / - main statistics page
router.get('/', async (req, res) => {
  try {
    const { tuNgay, denNgay, loai = 'thang' } = req.query;

    // ─── Basic counts ─────────────────────────────────────────────────────────
    const [tongKH, tongCanHo, tongHDDangKy, tongHDDaKy, tongHDHuy] = await Promise.all([
      KhachHang.count(),
      CanHo.count(),
      HopDong.count({ where: { TrangThaiHD: null } }),
      HopDong.count({ where: { TrangThaiHD: true } }),
      HopDong.count({ where: { TrangThaiHD: false } })
    ]);

    // ─── Revenue by month (last 12 months) via raw SQL ────────────────────────
    const doanhThuTheoThang = await sequelize.query(
      `SELECT FORMAT(NgayLap,'yyyy-MM') as period,
              COUNT(h.MaHopDong) as soHopDong,
              SUM(ISNULL(h.GiaThoaThuan, 0)) as tongDoanhThu
       FROM HopDong h
       WHERE h.[TrạngThaiHD] = 1
         AND NgayLap >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
       GROUP BY FORMAT(NgayLap,'yyyy-MM')
       ORDER BY period ASC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    // ─── Top apartments by contract count ─────────────────────────────────────
    const topCanHo = await sequelize.query(
      `SELECT TOP 10 c.MaCanHo, c.TenCanHo,
              COUNT(h.MaHopDong) as soHopDong,
              SUM(ISNULL(h.GiaThoaThuan, 0)) as tongGiaTri
       FROM CanHo c
       LEFT JOIN HopDong h ON c.MaCanHo = h.MaCanHo AND h.[TrạngThaiHD] = 1
       GROUP BY c.MaCanHo, c.TenCanHo
       ORDER BY soHopDong DESC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    // ─── Revenue by building ───────────────────────────────────────────────────
    const doanhThuToaNha = await sequelize.query(
      `SELECT tn.MaToaNha, tn.TenToaNha,
              COUNT(DISTINCT h.MaHopDong) as soHopDong,
              SUM(ISNULL(h.GiaThoaThuan, 0)) as tongDoanhThu
       FROM ToaNha tn
       INNER JOIN Tang t ON tn.MaToaNha = t.MaToaNha
       INNER JOIN CanHo c ON t.MaTang = c.MaTang
       LEFT JOIN HopDong h ON c.MaCanHo = h.MaCanHo AND h.[TrạngThaiHD] = 1
       GROUP BY tn.MaToaNha, tn.TenToaNha
       ORDER BY tongDoanhThu DESC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    // ─── Apartment occupancy by floor ─────────────────────────────────────────
    const tyLeCanHo = await sequelize.query(
      `SELECT
         SUM(CASE WHEN c.MaHienTrang IS NOT NULL THEN 1 ELSE 0 END) as daSuDung,
         SUM(CASE WHEN c.MaHienTrang IS NULL THEN 1 ELSE 0 END) as chuaSuDung,
         COUNT(*) as tong
       FROM CanHo c
       WHERE c.TTHienThi = 1`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ daSuDung: 0, chuaSuDung: 0, tong: 0 }]);

    // ─── New customers per month (last 6 months) ───────────────────────────────
    const khachHangMoi = await sequelize.query(
      `SELECT FORMAT(u.ThoiGianBatDauOnline,'yyyy-MM') as period,
              COUNT(k.MaKH) as soKhachHang
       FROM KhachHang k
       INNER JOIN AspNetUsers u ON k.UserId = u.Id
       WHERE u.ThoiGianBatDauOnline >= DATEADD(month, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
       GROUP BY FORMAT(u.ThoiGianBatDauOnline,'yyyy-MM')
       ORDER BY period ASC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    // ─── Service payment collection (HD_HopDong with CT_HDHD) ─────────────────
    const thuNhapDichVu = await sequelize.query(
      `SELECT FORMAT(hd.NgayThanhToan,'yyyy-MM') as period,
              SUM(ISNULL(ct.DonGia * ct.SL, 0)) as tongThu
       FROM HD_HopDong hd
       INNER JOIN CT_HDHD ct ON hd.MaHDHD = ct.MaHDHD
       WHERE hd.NgayThanhToan >= DATEADD(month, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
       GROUP BY FORMAT(hd.NgayThanhToan,'yyyy-MM')
       ORDER BY period ASC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    res.render('admin/thongKe/index', {
      title: 'Thống kê',
      layout: 'layouts/admin',
      stats: {
        tongKH,
        tongCanHo,
        tongHDDangKy,
        tongHDDaKy,
        tongHDHuy
      },
      doanhThuTheoThang,
      topCanHo,
      doanhThuToaNha,
      tyLeCanHo: tyLeCanHo[0] || { daSuDung: 0, chuaSuDung: 0, tong: 0 },
      khachHangMoi,
      thuNhapDichVu,
      tuNgay: tuNgay || '',
      denNgay: denNgay || '',
      loai
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', err.message);
    res.redirect('/admin/dashboard');
  }
});

// GET /doanh-thu - detailed revenue report
router.get('/doanh-thu', async (req, res) => {
  try {
    const { tuNgay, denNgay, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;

    let dateFilter = '';
    const replacements = {};
    if (tuNgay) { dateFilter += ' AND h.NgayLap >= :tuNgay'; replacements.tuNgay = tuNgay; }
    if (denNgay) { dateFilter += ' AND h.NgayLap <= :denNgay'; replacements.denNgay = denNgay; }

    const doanhThu = await sequelize.query(
      `SELECT h.MaHopDong, h.NgayLap, h.GiaThoaThuan,
              k.TenKH, c.TenCanHo,
              tn.TenToaNha, t.TenTang
       FROM HopDong h
       INNER JOIN KhachHang k ON h.MaKH = k.MaKH
       INNER JOIN CanHo c ON h.MaCanHo = c.MaCanHo
       INNER JOIN Tang t ON c.MaTang = t.MaTang
       INNER JOIN ToaNha tn ON t.MaToaNha = tn.MaToaNha
       WHERE h.[TrạngThaiHD] = 1 ${dateFilter}
       ORDER BY h.NgayLap DESC
       OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
      {
        type: sequelize.QueryTypes.SELECT,
        replacements: { ...replacements, offset, limit }
      }
    ).catch(() => []);

    const totalResult = await sequelize.query(
      `SELECT COUNT(*) as total, SUM(ISNULL(h.GiaThoaThuan,0)) as tongTien
       FROM HopDong h
       WHERE h.[TrạngThaiHD] = 1 ${dateFilter}`,
      { type: sequelize.QueryTypes.SELECT, replacements }
    ).catch(() => [{ total: 0, tongTien: 0 }]);

    const total = totalResult[0] ? parseInt(totalResult[0].total) : 0;
    const tongTien = totalResult[0] ? totalResult[0].tongTien : 0;

    res.render('admin/thongKe/doanhThu', {
      title: 'Báo cáo Doanh thu',
      layout: 'layouts/admin',
      items: doanhThu,
      total,
      tongTien,
      tuNgay: tuNgay || '',
      denNgay: denNgay || '',
      currentPage: +page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/thong-ke');
  }
});

// GET /hop-dong - contract statistics
router.get('/hop-dong', async (req, res) => {
  try {
    const thongKeHD = await sequelize.query(
      `SELECT
         lhd.TenLoai AS TenLoaiHD,
         COUNT(h.MaHopDong) as tong,
         SUM(CASE WHEN h.[TrạngThaiHD] = 1 THEN 1 ELSE 0 END) as daKy,
         SUM(CASE WHEN h.[TrạngThaiHD] = 0 THEN 1 ELSE 0 END) as daHuy,
         SUM(CASE WHEN h.[TrạngThaiHD] IS NULL THEN 1 ELSE 0 END) as dangXuLy
       FROM HopDong h
       INNER JOIN LoaiHopDong lhd ON h.MaLoaiHD = lhd.MaLoaiHD
       GROUP BY lhd.TenLoai
       ORDER BY tong DESC`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    res.render('admin/thongKe/hopDong', {
      title: 'Thống kê Hợp đồng',
      layout: 'layouts/admin',
      thongKeHD
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/thong-ke');
  }
});

// GET /can-ho - apartment statistics
router.get('/can-ho', async (req, res) => {
  try {
    const thongKeCanHo = await sequelize.query(
      `SELECT tn.TenToaNha, t.TenTang,
              COUNT(c.MaCanHo) as tongCanHo,
              SUM(CASE WHEN c.TTHienThi = 1 THEN 1 ELSE 0 END) as danhChoThue,
              AVG(CAST(c.Gia AS FLOAT)) as giaTrungBinh,
              AVG(CAST(c.GiaThue AS FLOAT)) as giaThueGiaTrungBinh
       FROM ToaNha tn
       INNER JOIN Tang t ON tn.MaToaNha = t.MaToaNha
       INNER JOIN CanHo c ON t.MaTang = c.MaTang
       GROUP BY tn.TenToaNha, t.TenTang
       ORDER BY tn.TenToaNha, t.TenTang`,
      { type: sequelize.QueryTypes.SELECT }
    ).catch(() => []);

    res.render('admin/thongKe/canHo', {
      title: 'Thống kê Căn hộ',
      layout: 'layouts/admin',
      thongKeCanHo
    });
  } catch (err) {
    req.flash('error_msg', err.message);
    res.redirect('/admin/thong-ke');
  }
});

module.exports = router;
