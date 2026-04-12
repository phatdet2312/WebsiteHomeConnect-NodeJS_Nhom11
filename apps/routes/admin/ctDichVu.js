const express = require('express');
const router = express.Router();
const {
  DichVu, CT_DichVu, CanHo, Tang, ToaNha, Ky,
  HD_DichVu, CT_HDDV, LS_TTHDDV, TrangThai, KhachHang, PTTT
} = require('../../models');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- Cấu hình Multer cho ảnh minh chứng ---
const minhChungStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../../public/images/anhminhchung');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const uploadMinhChung = multer({ storage: minhChungStorage, limits: { fileSize: 50 * 1024 * 1024 } });

async function getLatestLS(maDV, maCanHo, maKy) {
  const hdList = await HD_DichVu.findAll({
    include: [{ model: CT_HDDV, where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy }, required: true }]
  });
  if (!hdList.length) return null;
  const maHDDVList = hdList.map(h => h.MaHDDV);
  const lsList = await LS_TTHDDV.findAll({
    where: { MaHDDV: maHDDVList },
    include: [{ model: TrangThai, as: 'TrangThai' }],
    order: [['ThoiGianThayDoi', 'DESC']]
  });
  return lsList[0] || null;
}

// ============================================================================
// 1. ROUTES GIAO DIỆN
// ============================================================================
router.get('/', (req, res) => {
  res.render('admin/ctDichVu/index', { title: 'Quản Lý Gán Dịch Vụ', layout: 'layouts/admin' });
});

router.get('/chi-tiet/:id', async (req, res) => {
  try {
    const dichVu = await DichVu.findByPk(req.params.id);
    if (!dichVu) return res.redirect('/admin/ct-dich-vu');
    res.render('admin/ctDichVu/chiTietDichVu', {
      title: 'Chi Tiết Dịch Vụ - ' + dichVu.TenDV,
      layout: 'layouts/admin',
      dichVu 
    });
  } catch (err) {
    res.redirect('/admin/ct-dich-vu');
  }
});

// ============================================================================
// 2. API ENDPOINTS
// ============================================================================
router.get('/api/services', async (req, res) => {
  try {
      const dichVus = await DichVu.findAll({ where: { TTHienThi: true }, order: [['TenDV', 'ASC']] });
      res.json({ success: true, data: dichVus });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/workspace-data/:maDV', async (req, res) => {
  try {
    const maDV = parseInt(req.params.maDV);
    const ctList = await CT_DichVu.findAll({
      where: { MaDV: maDV },
      include: [
        { model: CanHo, as: 'CanHo', attributes: ['MaCanHo', 'TenCanHo'],
          include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }]
        },
        { model: Ky, as: 'Ky', attributes: ['MaKy', 'TenKy'] }
      ]
    });

    if (!ctList.length) return res.json({ success: true, data: [] });

    const grouped = {};
    for (const ct of ctList) {
      const key = ct.MaCanHo;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(ct);
    }

    const result = [];
    for (const [maCanHo, cts] of Object.entries(grouped)) {
      const first = cts[0];
      const kyMoiNhat = [...cts].sort((a, b) => b.MaKy - a.MaKy)[0];
      
      let tenTrangThai = 'Chưa thanh toán', tenPhuongThuc = '—', maKHTT = 0, tenKHTT = '?';
      const lsMoiNhat = await getLatestLS(maDV, parseInt(maCanHo), kyMoiNhat.MaKy);
      
      if (lsMoiNhat) {
        tenTrangThai = lsMoiNhat.TrangThai ? lsMoiNhat.TrangThai.TenTT : 'Không xác định';
        const hd = await HD_DichVu.findByPk(lsMoiNhat.MaHDDV, { include: [{ model: PTTT, as: 'PTTT' }, { model: KhachHang }] });
        if (hd) {
          tenPhuongThuc = hd.PTTT ? hd.PTTT.TenPT : '—';
          if(hd.KhachHang) { maKHTT = hd.KhachHang.MaKH; tenKHTT = hd.KhachHang.TenKH; }
        }
      }

      const danhSachKy = [];
      for(const ct of cts) {
         let ttKy = 'Chưa thanh toán', ptKy = '—', maKHMini = 0, tenKHMini = '?', ngayThayDoi = null;
         const lsKy = await getLatestLS(maDV, parseInt(maCanHo), ct.MaKy);
         if(lsKy) {
             ttKy = lsKy.TrangThai ? lsKy.TrangThai.TenTT : 'Không xác định';
             ngayThayDoi = lsKy.ThoiGianThayDoi ? new Date(lsKy.ThoiGianThayDoi).toLocaleString('vi-VN') : null;
             const hdKy = await HD_DichVu.findByPk(lsKy.MaHDDV, { include: [{ model: PTTT, as: 'PTTT' }, { model: KhachHang }] });
             if(hdKy) {
                 ptKy = hdKy.PTTT ? hdKy.PTTT.TenPT : '—';
                 if(hdKy.KhachHang) { maKHMini = hdKy.KhachHang.MaKH; tenKHMini = hdKy.KhachHang.TenKH; }
             }
         }
         danhSachKy.push({
             maKy: ct.MaKy,
             tenKy: ct.Ky ? ct.Ky.TenKy : '?',
             gia: ct.Gia || 0,
             ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toISOString().split('T')[0] : null,
             ghiChu: ct.GhiChu || '',
             urlAnh: ct.urlAnh || null,
             trangThaiHienThi: `${ttKy} (${ptKy})`,
             trangThaiKy: ttKy,
             phuongThucKy: ptKy,
             maKHmini: maKHMini,
             tenKHMini: tenKHMini,
             ngayThayDoi: ngayThayDoi
         });
      }
      danhSachKy.sort((a, b) => a.maKy - b.maKy);

      result.push({
        maDV: maDV,
        maCanHo: parseInt(maCanHo),
        tenCanHo: first.CanHo ? first.CanHo.TenCanHo : '?',
        tenTang: first.CanHo && first.CanHo.Tang ? first.CanHo.Tang.TenTang : '?',
        tenToaNha: first.CanHo && first.CanHo.Tang && first.CanHo.Tang.ToaNha ? first.CanHo.Tang.ToaNha.TenToaNha : '?',
        ngayThanhToanMoiNhat: lsMoiNhat ? new Date(lsMoiNhat.ThoiGianThayDoi).toLocaleString('vi-VN') : null,
        tenTrangThai: tenTrangThai,
        tenPhuongThuc: tenPhuongThuc,
        maKHThanhToan: maKHTT,
        tenKHThanhToan: tenKHTT,
        danhSachKy: danhSachKy,
        kyMoiNhat: {
            maKy: kyMoiNhat.MaKy,
            tenKy: kyMoiNhat.Ky ? kyMoiNhat.Ky.TenKy : '?',
            gia: kyMoiNhat.Gia || 0,
            ngayDenHan: kyMoiNhat.NgayDenHan ? new Date(kyMoiNhat.NgayDenHan).toLocaleDateString('vi-VN') : null
        }
      });
    }
    result.sort((a, b) => (a.tenToaNha.localeCompare(b.tenToaNha, 'vi')) || (a.tenTang.localeCompare(b.tenTang, 'vi')) || (a.tenCanHo.localeCompare(b.tenCanHo, 'vi')));
    res.json({ success: true, data: result });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/metadata', async (req, res) => {
  try {
    const [toaNhas, tangs, kys, trangThais] = await Promise.all([
      ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }),
      Tang.findAll({ order: [['TenTang', 'ASC']] }),
      Ky.findAll({ order: [['MaKy', 'ASC']] }),
      TrangThai.findAll({ order: [['TenTT', 'ASC']] }) // Lấy thêm trạng thái
    ]);
    res.json({ 
        success: true, 
        toaNhas: toaNhas.map(t => ({ maToaNha: t.MaToaNha, tenToaNha: t.TenToaNha })),
        tangs: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang, maToaNha: t.MaToaNha })),
        kys: kys.map(k => ({ maKy: k.MaKy, tenKy: k.TenKy })),
        trangThais: trangThais.map(tt => ({ maTT: tt.MaTT, tenTT: tt.TenTT }))
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/lay-tang', async (req, res) => {
  try {
    const tangs = await Tang.findAll({ where: { MaToaNha: parseInt(req.query.maToaNha) }, order: [['TenTang', 'ASC']] });
    res.json({ success: true, data: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang })) });
  } catch (err) { res.json({ success: false, data: [] }); }
});

router.get('/api/lay-can-ho', async (req, res) => {
  try {
    const where = {};
    if (req.query.maTang) where.MaTang = parseInt(req.query.maTang);
    let canHos = await CanHo.findAll({
      where, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']]
    });
    if (req.query.maToaNha && !req.query.maTang) {
      canHos = canHos.filter(ch => ch.Tang && ch.Tang.MaToaNha === parseInt(req.query.maToaNha));
    }
    res.json({ success: true, data: canHos.map(ch => ({
      maCanHo: ch.MaCanHo, tenCanHo: ch.TenCanHo,
      tenTang: ch.Tang ? ch.Tang.TenTang : '', tenToaNha: ch.Tang && ch.Tang.ToaNha ? ch.Tang.ToaNha.TenToaNha : 'Chưa có'
    }))});
  } catch (err) { res.json({ success: false, data: [] }); }
});

router.post('/api/gan-ky-hang-loat', uploadMinhChung.array('anhMinhChung', 50), async (req, res) => {
  try {
    const { maDV, maKy } = req.body;
    let dsCanHo = req.body.danhSachCanHo;
    let dsGia = req.body.giaList;
    let dsHan = req.body.ngayDenHanList;
    let dsGhiChu = req.body.ghiChuList;
    let dsMaAnh = req.body.maCanHoAnh;

    if (!dsCanHo) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });
    
    dsCanHo = Array.isArray(dsCanHo) ? dsCanHo : [dsCanHo];
    dsGia = Array.isArray(dsGia) ? dsGia : [dsGia];
    dsHan = Array.isArray(dsHan) ? dsHan : [dsHan];
    dsGhiChu = Array.isArray(dsGhiChu) ? dsGhiChu : [dsGhiChu];
    dsMaAnh = Array.isArray(dsMaAnh) ? dsMaAnh : (dsMaAnh ? [dsMaAnh] : []);
    dsMaAnh = dsMaAnh.map(Number);

    const files = req.files || [];
    let anhIndex = 0;

    for (let i = 0; i < dsCanHo.length; i++) {
      const maCH = parseInt(dsCanHo[i]);
      let urlAnh = null;
      if (dsMaAnh.includes(maCH) && anhIndex < files.length) {
        urlAnh = '/images/anhminhchung/' + files[anhIndex].filename;
        anhIndex++;
      }

      const existing = await CT_DichVu.findOne({ where: { MaDV: parseInt(maDV), MaCanHo: maCH, MaKy: parseInt(maKy) } });
      const payload = {
        Gia: parseInt(dsGia[i]) || 0,
        NgayDenHan: dsHan[i] || null,
        GhiChu: dsGhiChu[i] || null,
        urlAnh: urlAnh || (existing ? existing.urlAnh : null)
      };

      if (existing) await existing.update(payload);
      else await CT_DichVu.create({ MaDV: parseInt(maDV), MaCanHo: maCH, MaKy: parseInt(maKy), ...payload });
    }
    res.json({ success: true, message: `Gán kỳ thành công cho ${dsCanHo.length} căn hộ!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/cap-nhat-inline', async (req, res) => {
  try {
    const { maCanHo, maDV, maKy, gia, ngayDenHan, ghiChu } = req.body;
    const ct = await CT_DichVu.findOne({ where: { MaDV: parseInt(maDV), MaCanHo: parseInt(maCanHo), MaKy: parseInt(maKy) } });
    if (!ct) return res.status(404).json({ success: false, message: 'Không tìm thấy!' });
    
    await ct.update({ Gia: parseInt(gia) || 0, NgayDenHan: ngayDenHan || null, GhiChu: ghiChu || null });
    res.json({ success: true, message: 'Cập nhật thành công!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/xoa-ct', async (req, res) => {
  try {
    const { maCanHo, maDV, maKy } = req.body;
    const count = await CT_HDDV.count({ where: { MaDV: parseInt(maDV), MaCanHo: parseInt(maCanHo), MaKy: parseInt(maKy) } });
    if (count > 0) return res.json({ success: false, message: 'Đã có hóa đơn thanh toán, không thể xóa!' });
    
    await CT_DichVu.destroy({ where: { MaDV: parseInt(maDV), MaCanHo: parseInt(maCanHo), MaKy: parseInt(maKy) } });
    res.json({ success: true, message: 'Xóa gán kỳ thành công!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/ky/thao-tac', async (req, res) => {
  try {
    const { action, maKy, tenKy } = req.body;
    if (action === 'add') {
      await Ky.create({ TenKy: tenKy });
      return res.json({ success: true, message: 'Thêm kỳ thành công' });
    } else if (action === 'edit') {
      await Ky.update({ TenKy: tenKy }, { where: { MaKy: parseInt(maKy) } });
      return res.json({ success: true, message: 'Sửa kỳ thành công' });
    } else if (action === 'delete') {
      const inUse = await CT_DichVu.count({ where: { MaKy: parseInt(maKy) } });
      if (inUse > 0) return res.json({ success: false, message: 'Kỳ đang được sử dụng, không thể xóa!' });
      await Ky.destroy({ where: { MaKy: parseInt(maKy) } });
      return res.json({ success: true, message: 'Xóa kỳ thành công' });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/chi-tiet-thanh-toan', async (req, res) => {
  try {
    const maDV = parseInt(req.query.maDV);
    const maCanHo = parseInt(req.query.maCanHo);
    const maKy = parseInt(req.query.maKy);

    const chiTietHoaDon = await CT_HDDV.findAll({ where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy } });
    if (!chiTietHoaDon.length) return res.json({ success: true, daThanhToan: false, message: 'Chưa có thanh toán nào cho kỳ này.' });

    const maHDDVList = [...new Set(chiTietHoaDon.map(ct => ct.MaHDDV))];
    const hoaDons = await HD_DichVu.findAll({ where: { MaHDDV: maHDDVList }, include: [{ model: PTTT, as: 'PTTT' }] });

    const result = [];
    for (const hd of hoaDons) {
      const lichSu = await LS_TTHDDV.findAll({
        where: { MaHDDV: hd.MaHDDV },
        include: [{ model: TrangThai, as: 'TrangThai' }],
        order: [['ThoiGianThayDoi', 'DESC']]
      });
      const tMoiNhat = lichSu[0] || null;
      const tongTien = chiTietHoaDon.filter(ct => ct.MaHDDV === hd.MaHDDV).reduce((s, ct) => s + (Number(ct.DonGia) || 0), 0);

      result.push({
        maHDDV: hd.MaHDDV,
        ngayThanhToan: hd.NgayThanhToan ? new Date(hd.NgayThanhToan).toLocaleString('vi-VN') : '',
        phuongThuc: hd.PTTT ? hd.PTTT.TenPT : 'Chưa xác định',
        tongTien,
        trangThai: tMoiNhat && tMoiNhat.TrangThai ? tMoiNhat.TrangThai.TenTT : 'Không xác định',
        trangThaiMau: tMoiNhat && tMoiNhat.MaTT === 6 ? 'success' : 'warning', 
        lichSu: lichSu.map(ls => ({
          thoiGian: ls.ThoiGianThayDoi ? new Date(ls.ThoiGianThayDoi).toLocaleString('vi-VN') : '',
          trangThai: ls.TrangThai ? ls.TrangThai.TenTT : '',
          ghiChu: ls.GhiChu || ''
        }))
      });
    }
    res.json({ success: true, daThanhToan: true, hoaDons: result });
  } catch (err) { res.json({ success: false, message: err.message }); }
});

// API: Thêm mới lịch sử trạng thái hóa đơn
router.post('/api/cap-nhat-trang-thai-hoa-don', async (req, res) => {
    try {
        const { maHDDV, maTT, ghiChu } = req.body;
        await LS_TTHDDV.create({
            MaHDDV: parseInt(maHDDV),
            MaTT: parseInt(maTT),
            ThoiGianThayDoi: new Date(),
            GhiChu: ghiChu || 'Cập nhật từ Workspace'
        });
        res.json({ success: true, message: 'Đã cập nhật trạng thái hóa đơn!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;