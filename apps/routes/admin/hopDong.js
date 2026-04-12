const express = require('express');
const router = express.Router();
const {
  HopDong, KhachHang, CanHo, Tang, ToaNha,
  LoaiHopDong, VaiTroHD, NhanVien, DSA_HopDong
} = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// --- Cấu hình Multer cho Ảnh Hợp đồng ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'urlAnhHD' ? 'anhhopdong' : 'dsanhhopdong';
    const dir = path.join(__dirname, '../../../public/images', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).fields([
  { name: 'urlAnhHD', maxCount: 1 },
  { name: 'additionalImages', maxCount: 30 }
]);

const hopDongIncludes = [
  { model: KhachHang, as: 'KhachHang', attributes: ['MaKH', 'TenKH', 'EmailKH', 'DTKH'] },
  { model: CanHo, as: 'CanHo', attributes: ['MaCanHo', 'TenCanHo'],
    include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }]
  },
  { model: LoaiHopDong, as: 'LoaiHopDong', attributes: ['MaLoaiHD', 'TenLoai'] },
  { model: VaiTroHD, as: 'VaiTroHD', attributes: ['MaVaiTroHD', 'TenVaiTro'] },
  { model: NhanVien, as: 'NhanVien', attributes: ['MaNV', 'TenNV'] }
];

// --- Helper Chấm điểm Tìm kiếm ---
function tinhSoTuKhop(hd, tuKhoaArray) {
  let diem = 0;
  const tenKH = ((hd.KhachHang && hd.KhachHang.TenKH) || '').toLowerCase().split(/\s+/).filter(Boolean);
  const tenCH = ((hd.CanHo && hd.CanHo.TenCanHo) || '').toLowerCase().split(/\s+/).filter(Boolean);
  for (const tu of tuKhoaArray) {
    if (tenKH.includes(tu)) diem += 2;
    if (tenCH.includes(tu)) diem += 1;
  }
  return diem;
}
function tinhSoKyTuKhop(hd, tuKhoa) {
  let diem = 0;
  const tenKH = ((hd.KhachHang && hd.KhachHang.TenKH) || '').toLowerCase();
  const tenCH = ((hd.CanHo && hd.CanHo.TenCanHo) || '').toLowerCase();
  const parts = tuKhoa.split(/\s+/).filter(Boolean);
  for (const tu of parts) {
    if (tenKH.includes(tu)) diem += tu.length * 2;
    if (tenCH.includes(tu)) diem += tu.length;
  }
  return diem;
}

// ============================================================================
// 1. ROUTES GIAO DIỆN (CHỈ TRẢ VỀ KHUNG HTML)
// ============================================================================
router.get('/', (req, res) => res.render('admin/hopDong/index', { title: 'Quản lý Hợp đồng', layout: 'layouts/admin' }));
router.get('/add', (req, res) => res.render('admin/hopDong/add', { title: 'Thêm Hợp đồng', layout: 'layouts/admin' }));
router.get('/update/:id', (req, res) => res.render('admin/hopDong/update', { title: 'Sửa Hợp đồng', layout: 'layouts/admin', id: req.params.id }));
router.get('/display/:id', (req, res) => res.render('admin/hopDong/display', { title: 'Chi tiết Hợp đồng', layout: 'layouts/admin', id: req.params.id }));

// ============================================================================
// 2. API ENDPOINTS
// ============================================================================

// Lấy Master Data cho Form (Dropdowns)
router.get('/api/form-data', async (req, res) => {
  try {
    const [khachHangs, canHos, loaiHDs, vaiTroHDs, nhanViens] = await Promise.all([
      KhachHang.findAll({ order: [['TenKH', 'ASC']] }),
      CanHo.findAll({ where: { TTHienThi: true }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']] }),
      LoaiHopDong.findAll({ order: [['TenLoai', 'ASC']] }),
      VaiTroHD.findAll({ order: [['TenVaiTro', 'ASC']] }),
      NhanVien.findAll({ order: [['TenNV', 'ASC']] })
    ]);
    res.json({ success: true, data: {
      khachHangs: khachHangs.map(k => ({ maKH: k.MaKH, tenKH: k.TenKH, sdt: k.DTKH })),
      canHos: canHos.map(c => ({ maCanHo: c.MaCanHo, tenCanHo: c.TenCanHo, tenTang: c.Tang?.TenTang, tenToaNha: c.Tang?.ToaNha?.TenToaNha })),
      loaiHDs: loaiHDs.map(l => ({ maLoaiHD: l.MaLoaiHD, tenLoai: l.TenLoai })),
      vaiTroHDs: vaiTroHDs.map(v => ({ maVaiTroHD: v.MaVaiTroHD, tenVaiTro: v.TenVaiTro })),
      nhanViens: nhanViens.map(n => ({ maNV: n.MaNV, tenNV: n.TenNV }))
    }});
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Lấy danh sách hợp đồng
router.get('/api/list', async (req, res) => {
  try {
    const { search = '', trangThai = 'tatCa', loaiHD = '', vaiTro = '', sortLap = 'macDinh', sortXuLy = 'macDinh', page = 1 } = req.query;
    const limit = 10;
    
    let hopDongs = await HopDong.findAll({ include: hopDongIncludes });
    hopDongs = hopDongs.map(h => h.get({ plain: true }));

    // Lọc trạng thái
    if (trangThai === 'null') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === null);
    else if (trangThai === 'true') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === true);
    else if (trangThai === 'false') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === false);

    // Lọc loại & vai trò
    if (loaiHD) hopDongs = hopDongs.filter(hd => hd.MaLoaiHD == loaiHD);
    if (vaiTro) hopDongs = hopDongs.filter(hd => hd.VaiTroHD?.TenVaiTro == vaiTro);

    // Sắp xếp
    if (sortLap === 'moiNhat') hopDongs.sort((a, b) => new Date(b.NgayLap) - new Date(a.NgayLap));
    else if (sortLap === 'cuNhat') hopDongs.sort((a, b) => new Date(a.NgayLap) - new Date(b.NgayLap));

    if (sortXuLy === 'somNhat') hopDongs.sort((a, b) => new Date(a.NgayXuLyDuKien || 0) - new Date(b.NgayXuLyDuKien || 0));
    else if (sortXuLy === 'treNhat') hopDongs.sort((a, b) => new Date(b.NgayXuLyDuKien || 0) - new Date(a.NgayXuLyDuKien || 0));
    else if (sortLap === 'macDinh') hopDongs.sort((a, b) => b.MaHopDong - a.MaHopDong); // Mặc định ID giảm dần

    // Tìm kiếm
    let ketQuaTimKiem = null, suggestions = [];
    if (search) {
      if (search.includes(',')) {
        const ids = search.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
        const found = hopDongs.filter(hd => ids.includes(hd.MaHopDong));
        if (found.length > 0) hopDongs = found;
        else { ketQuaTimKiem = 'Không tìm thấy mã HĐ.'; suggestions = hopDongs.slice(0, 3); hopDongs = []; }
      } else {
        const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
        const scored = hopDongs.map(hd => ({ hd, diem: tinhSoTuKhop(hd, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
        if (scored.length > 0) hopDongs = scored.map(x => x.hd);
        else { ketQuaTimKiem = 'Không có hợp đồng liên quan.'; suggestions = hopDongs.slice(0, 3); hopDongs = []; }
      }
    }

    const totalItems = hopDongs.length;
    const paginatedData = hopDongs.slice((page - 1) * limit, page * limit);

    res.json({ success: true, data: paginatedData, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: parseInt(page), message: ketQuaTimKiem, suggestions });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/suggestions', async (req, res) => {
  try {
    const term = (req.query.term || '').toLowerCase();
    if (!term) return res.json({ success: true, data: [] });
    let hopDongs = await HopDong.findAll({ include: hopDongIncludes });
    hopDongs = hopDongs.map(h => h.get({ plain: true }));
    const scored = hopDongs.map(hd => ({ hd, diem: tinhSoKyTuKhop(hd, term) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 3);
    res.json({ success: true, data: scored.map(x => x.hd) });
  } catch (err) { res.status(500).json({ success: false }); }
});

router.get('/api/detail/:id', async (req, res) => {
  try {
    const item = await HopDong.findByPk(req.params.id, { include: [...hopDongIncludes, { model: DSA_HopDong }] });
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// THÊM MỚI
router.post('/api/add', upload, async (req, res) => {
  try {
    const data = req.body;
    const UrlAnhHD = req.files && req.files['urlAnhHD'] ? '/images/anhhopdong/' + req.files['urlAnhHD'][0].filename : null;
    
    const hd = await HopDong.create({
      MaKH: parseInt(data.MaKH), MaCanHo: parseInt(data.MaCanHo),
      MaLoaiHD: parseInt(data.MaLoaiHD), MaVaiTroHD: parseInt(data.MaVaiTroHD),
      MaNV: data.MaNV ? parseInt(data.MaNV) : null,
      GiaTriCanHo: data.GiaTriCanHo ? parseInt(data.GiaTriCanHo) : null,
      GiaThoaThuan: data.GiaThoaThuan ? parseInt(data.GiaThoaThuan) : null,
      NgayLap: data.NgayLap || new Date(), NgayXuLyDuKien: data.NgayXuLyDuKien || null,
      NgayHieuLuc: data.NgayHieuLuc || null, NgayHetHan: data.NgayHetHan || null,
      DiaChiKyHopDong: data.DiaChiKyHopDong || null, UrlAnhHD, SDTNhanLienLac: data.SDTNhanLienLac || null,
      TrangThaiHD: null // Mặc định chờ duyệt
    });

    if (req.files && req.files['additionalImages']) {
      for (const img of req.files['additionalImages']) {
        await DSA_HopDong.create({ MaHopDong: hd.MaHopDong, UrlAnh: '/images/dsanhhopdong/' + img.filename });
      }
    }
    res.json({ success: true, message: 'Tạo hợp đồng thành công', id: hd.MaHopDong });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// CẬP NHẬT
router.post('/api/update/:id', upload, async (req, res) => {
  try {
    const hd = await HopDong.findByPk(req.params.id, { include: [{ model: DSA_HopDong }] });
    if (!hd) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

    const data = req.body;
    let UrlAnhHD = hd.UrlAnhHD;
    if (req.files && req.files['urlAnhHD']) {
      if (hd.UrlAnhHD) {
        const oldP = path.join(__dirname, '../../../public', hd.UrlAnhHD);
        if (fs.existsSync(oldP)) fs.unlinkSync(oldP);
      }
      UrlAnhHD = '/images/anhhopdong/' + req.files['urlAnhHD'][0].filename;
    }

    // Xóa ảnh bổ sung
    if (data.DSA_HopDongToDelete) {
      const idsToDelete = Array.isArray(data.DSA_HopDongToDelete) ? data.DSA_HopDongToDelete : [data.DSA_HopDongToDelete];
      for (const maAnh of idsToDelete) {
        const anh = await DSA_HopDong.findByPk(maAnh);
        if (anh) {
          const p = path.join(__dirname, '../../../public', anh.UrlAnh);
          if (fs.existsSync(p)) fs.unlinkSync(p);
          await anh.destroy();
        }
      }
    }

    // Thêm ảnh bổ sung
    if (req.files && req.files['additionalImages']) {
      for (const img of req.files['additionalImages']) {
        await DSA_HopDong.create({ MaHopDong: hd.MaHopDong, UrlAnh: '/images/dsanhhopdong/' + img.filename });
      }
    }

    let parsedTrangThai = hd.TrangThaiHD;
    if (data.TrangThaiHD === 'null') parsedTrangThai = null;
    else if (data.TrangThaiHD === 'true') parsedTrangThai = true;
    else if (data.TrangThaiHD === 'false') parsedTrangThai = false;

    await hd.update({
      MaKH: parseInt(data.MaKH), MaCanHo: parseInt(data.MaCanHo),
      MaLoaiHD: parseInt(data.MaLoaiHD), MaVaiTroHD: parseInt(data.MaVaiTroHD),
      MaNV: data.MaNV ? parseInt(data.MaNV) : null,
      GiaTriCanHo: data.GiaTriCanHo ? parseInt(data.GiaTriCanHo) : null,
      GiaThoaThuan: data.GiaThoaThuan ? parseInt(data.GiaThoaThuan) : null,
      NgayLap: data.NgayLap || hd.NgayLap, NgayXuLyDuKien: data.NgayXuLyDuKien || null,
      NgayHieuLuc: data.NgayHieuLuc || null, NgayHetHan: data.NgayHetHan || null,
      DiaChiKyHopDong: data.DiaChiKyHopDong || null, UrlAnhHD, SDTNhanLienLac: data.SDTNhanLienLac || null,
      TrangThaiHD: parsedTrangThai
    });

    res.json({ success: true, message: 'Cập nhật thành công' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// XÓA
router.post('/api/delete-multiple', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
    if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn hợp đồng' });

    for (const id of ids) {
      const hd = await HopDong.findByPk(id, { include: [{ model: DSA_HopDong }] });
      if (hd) {
        if (hd.UrlAnhHD) {
          const p = path.join(__dirname, '../../../public', hd.UrlAnhHD);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        for (const dsa of hd.DSA_HopDongS || []) {
          const p = path.join(__dirname, '../../../public', dsa.UrlAnh);
          if (fs.existsSync(p)) fs.unlinkSync(p);
        }
        await hd.destroy();
      }
    }
    res.json({ success: true, message: `Đã xóa ${ids.length} hợp đồng` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/change-status/:id', async (req, res) => {
  try {
    const hd = await HopDong.findByPk(req.params.id);
    if (!hd) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    await hd.update({ TrangThaiHD: req.body.status === 'true' });
    res.json({ success: true, message: 'Đổi trạng thái thành công' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/update-status-batch', async (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
    if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn' });
    
    const status = req.body.status === 'null' ? null : (req.body.status === 'true');
    await HopDong.update({ TrangThaiHD: status }, { where: { MaHopDong: ids } });
    res.json({ success: true, message: `Đã cập nhật trạng thái cho ${ids.length} hợp đồng` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;