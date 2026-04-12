const express = require('express');
const router = express.Router();
const {
  LoaiTTHD, CT_ThanhToan, CanHo, Tang, ToaNha, KyTT,
  HD_HopDong, CT_HDHD, LS_TTHDHD, TrangThai, HopDong, KhachHang, PTTT
} = require('../../models');

// --- Helper: Lấy lịch sử trạng thái mới nhất ---
async function getLatestLS(maLoaiTT, maCanHo, maKyTT) {
  const hdList = await HD_HopDong.findAll({
    include: [{ model: CT_HDHD, where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT }, required: true }]
  });
  if (!hdList.length) return null;
  const maHDHDList = hdList.map(h => h.MaHDHD);
  const lsList = await LS_TTHDHD.findAll({
    where: { MaHDHD: maHDHDList },
    include: [{ model: TrangThai, as: 'TrangThai' }],
    order: [['ThoiGianThayDoi', 'DESC']]
  });
  return lsList[0] || null;
}

// ============================================================================
// 1. ROUTES GIAO DIỆN (CHỈ RENDER KHUNG EJS)
// ============================================================================

router.get('/', (req, res) => {
  res.render('admin/ctThanhToan/index', { title: 'Quản Lý Loại Thanh Toán Hợp Đồng', layout: 'layouts/admin' });
});

router.get('/chi-tiet/:id', async (req, res) => {
  try {
    const loaiTT = await LoaiTTHD.findByPk(req.params.id);
    if (!loaiTT) return res.redirect('/admin/ct-thanh-toan');
    res.render('admin/ctThanhToan/chiTietThanhToan', {
      title: 'Workspace - ' + loaiTT.TenLoaiTT,
      layout: 'layouts/admin',
      loaiTT 
    });
  } catch (err) {
    res.redirect('/admin/ct-thanh-toan');
  }
});

// ============================================================================
// 2. API ENDPOINTS (XỬ LÝ DỮ LIỆU JSON)
// ============================================================================

router.get('/api/services', async (req, res) => {
  try {
      const list = await LoaiTTHD.findAll({ where: { TTHienThi: true }, order: [['TenLoaiTT', 'ASC']] });
      res.json({ success: true, data: list });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/workspace-data/:maLoaiTT', async (req, res) => {
  try {
    const maLoaiTT = parseInt(req.params.maLoaiTT);
    const ctList = await CT_ThanhToan.findAll({
      where: { MaLoaiTT: maLoaiTT },
      include: [
        { model: CanHo, as: 'CanHoTT', attributes: ['MaCanHo', 'TenCanHo'],
          include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }]
        },
        { model: KyTT, attributes: ['MaKyTT', 'TenKyTT'] }
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
      const kyMoiNhat = [...cts].sort((a, b) => b.MaKyTT - a.MaKyTT)[0];
      
      let tenTrangThai = 'Chưa thanh toán', tenPhuongThuc = '—', maKHTT = 0, tenKHTT = '?';
      const lsMoiNhat = await getLatestLS(maLoaiTT, parseInt(maCanHo), kyMoiNhat.MaKyTT);
      
      if (lsMoiNhat) {
        tenTrangThai = lsMoiNhat.TrangThai ? lsMoiNhat.TrangThai.TenTT : 'Không xác định';
        const hd = await HD_HopDong.findByPk(lsMoiNhat.MaHDHD, { 
            include: [
                { model: PTTT, as: 'PTTT' }, 
                { model: HopDong, as: 'HopDong', include: [{ model: KhachHang, as: 'KhachHang' }] }
            ] 
        });
        if (hd) {
          tenPhuongThuc = hd.PTTT ? hd.PTTT.TenPT : '—';
          if(hd.HopDong && hd.HopDong.KhachHang) { maKHTT = hd.HopDong.KhachHang.MaKH; tenKHTT = hd.HopDong.KhachHang.TenKH; }
        }
      }

      const danhSachKy = [];
      for(const ct of cts) {
         let ttKy = 'Chưa thanh toán', ptKy = '—', maKHMini = 0, tenKHMini = '?', ngayThayDoi = null;
         const lsKy = await getLatestLS(maLoaiTT, parseInt(maCanHo), ct.MaKyTT);
         if(lsKy) {
             ttKy = lsKy.TrangThai ? lsKy.TrangThai.TenTT : 'Không xác định';
             ngayThayDoi = lsKy.ThoiGianThayDoi ? new Date(lsKy.ThoiGianThayDoi).toLocaleString('vi-VN') : null;
             const hdKy = await HD_HopDong.findByPk(lsKy.MaHDHD, { 
                include: [{ model: PTTT, as: 'PTTT' }, { model: HopDong, as: 'HopDong', include: [{ model: KhachHang, as: 'KhachHang' }] }] 
             });
             if(hdKy) {
                 ptKy = hdKy.PTTT ? hdKy.PTTT.TenPT : '—';
                 if(hdKy.HopDong && hdKy.HopDong.KhachHang) { maKHMini = hdKy.HopDong.KhachHang.MaKH; tenKHMini = hdKy.HopDong.KhachHang.TenKH; }
             }
         }
         danhSachKy.push({
             maKyTT: ct.MaKyTT,
             tenKyTT: ct.KyTT ? ct.KyTT.TenKyTT : '?',
             gia: ct.Gia || 0,
             ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toISOString().split('T')[0] : null,
             ghiChu: ct.GhiChu || '',
             trangThaiHienThi: `${ttKy} (${ptKy})`,
             trangThaiKy: ttKy,
             phuongThucKy: ptKy,
             maKHmini: maKHMini,
             tenKHMini: tenKHMini,
             ngayThayDoi: ngayThayDoi
         });
      }
      danhSachKy.sort((a, b) => a.maKyTT - b.maKyTT);

      result.push({
        maLoaiTT: maLoaiTT,
        maCanHo: parseInt(maCanHo),
        tenCanHo: first.CanHoTT ? first.CanHoTT.TenCanHo : '?',
        tenTang: first.CanHoTT && first.CanHoTT.Tang ? first.CanHoTT.Tang.TenTang : '?',
        tenToaNha: first.CanHoTT && first.CanHoTT.Tang && first.CanHoTT.Tang.ToaNha ? first.CanHoTT.Tang.ToaNha.TenToaNha : '?',
        ngayThanhToanMoiNhat: lsMoiNhat ? new Date(lsMoiNhat.ThoiGianThayDoi).toLocaleString('vi-VN') : null,
        tenTrangThai: tenTrangThai,
        tenPhuongThuc: tenPhuongThuc,
        maKHThanhToan: maKHTT,
        tenKHThanhToan: tenKHTT,
        danhSachKy: danhSachKy,
        kyMoiNhat: {
            maKyTT: kyMoiNhat.MaKyTT,
            tenKyTT: kyMoiNhat.KyTT ? kyMoiNhat.KyTT.TenKyTT : '?',
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
      KyTT.findAll({ order: [['MaKyTT', 'ASC']] }),
      TrangThai.findAll({ order: [['TenTT', 'ASC']] })
    ]);
    
    res.json({ 
        success: true, 
        toaNhas: toaNhas.map(t => ({ maToaNha: t.MaToaNha, tenToaNha: t.TenToaNha })),
        tangs: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang, maToaNha: t.MaToaNha })),
        kys: kys.map(k => ({ maKyTT: k.MaKyTT, tenKyTT: k.TenKyTT })),
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

router.post('/api/gan-ky-hang-loat', async (req, res) => {
  try {
    const { maLoaiTT, maKyTT } = req.body;
    let dsCanHo = req.body.danhSachCanHo;
    let dsGia = req.body.giaList;
    let dsHan = req.body.ngayDenHanList;
    let dsGhiChu = req.body.ghiChuList;

    if (!dsCanHo) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });
    
    dsCanHo = Array.isArray(dsCanHo) ? dsCanHo : [dsCanHo];
    dsGia = Array.isArray(dsGia) ? dsGia : [dsGia];
    dsHan = Array.isArray(dsHan) ? dsHan : [dsHan];
    dsGhiChu = Array.isArray(dsGhiChu) ? dsGhiChu : [dsGhiChu];

    for (let i = 0; i < dsCanHo.length; i++) {
      const maCH = parseInt(dsCanHo[i]);
      const existing = await CT_ThanhToan.findOne({ where: { MaLoaiTT: parseInt(maLoaiTT), MaCanHo: maCH, MaKyTT: parseInt(maKyTT) } });
      const payload = {
        Gia: parseInt(dsGia[i]) || 0,
        NgayDenHan: dsHan[i] || null,
        GhiChu: dsGhiChu[i] || null
      };

      if (existing) await existing.update(payload);
      else await CT_ThanhToan.create({ MaLoaiTT: parseInt(maLoaiTT), MaCanHo: maCH, MaKyTT: parseInt(maKyTT), ...payload });
    }
    res.json({ success: true, message: `Gán kỳ thành công cho ${dsCanHo.length} căn hộ!` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/cap-nhat-inline', async (req, res) => {
  try {
    const { maCanHo, maLoaiTT, maKyTT, gia, ngayDenHan, ghiChu } = req.body;
    const ct = await CT_ThanhToan.findOne({ where: { MaLoaiTT: parseInt(maLoaiTT), MaCanHo: parseInt(maCanHo), MaKyTT: parseInt(maKyTT) } });
    if (!ct) return res.status(404).json({ success: false, message: 'Không tìm thấy!' });
    
    await ct.update({ Gia: parseInt(gia) || 0, NgayDenHan: ngayDenHan || null, GhiChu: ghiChu || null });
    res.json({ success: true, message: 'Cập nhật thành công!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/xoa-ct', async (req, res) => {
  try {
    const { maCanHo, maLoaiTT, maKyTT } = req.body;
    const count = await CT_HDHD.count({ where: { MaLoaiTT: parseInt(maLoaiTT), MaCanHo: parseInt(maCanHo), MaKyTT: parseInt(maKyTT) } });
    if (count > 0) return res.json({ success: false, message: 'Đã có hóa đơn thanh toán, không thể xóa!' });
    
    await CT_ThanhToan.destroy({ where: { MaLoaiTT: parseInt(maLoaiTT), MaCanHo: parseInt(maCanHo), MaKyTT: parseInt(maKyTT) } });
    res.json({ success: true, message: 'Xóa gán kỳ thành công!' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/ky/thao-tac', async (req, res) => {
  try {
    const { action, maKyTT, tenKyTT } = req.body;
    if (action === 'add') {
      await KyTT.create({ TenKyTT: tenKyTT });
      return res.json({ success: true, message: 'Thêm kỳ thành công' });
    } else if (action === 'edit') {
      await KyTT.update({ TenKyTT: tenKyTT }, { where: { MaKyTT: parseInt(maKyTT) } });
      return res.json({ success: true, message: 'Sửa kỳ thành công' });
    } else if (action === 'delete') {
      const inUse = await CT_ThanhToan.count({ where: { MaKyTT: parseInt(maKyTT) } });
      if (inUse > 0) return res.json({ success: false, message: 'Kỳ đang được sử dụng, không thể xóa!' });
      await KyTT.destroy({ where: { MaKyTT: parseInt(maKyTT) } });
      return res.json({ success: true, message: 'Xóa kỳ thành công' });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/chi-tiet-thanh-toan', async (req, res) => {
  try {
    const maLoaiTT = parseInt(req.query.maLoaiTT);
    const maCanHo = parseInt(req.query.maCanHo);
    const maKyTT = parseInt(req.query.maKyTT);

    const chiTietHoaDon = await CT_HDHD.findAll({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT } });
    if (!chiTietHoaDon.length) return res.json({ success: true, daThanhToan: false, message: 'Chưa có thanh toán nào cho kỳ này.' });

    const maHDHDList = [...new Set(chiTietHoaDon.map(ct => ct.MaHDHD))];
    const hoaDons = await HD_HopDong.findAll({ where: { MaHDHD: maHDHDList }, include: [{ model: PTTT, as: 'PTTT' }] });

    const result = [];
    for (const hd of hoaDons) {
      const lichSu = await LS_TTHDHD.findAll({
        where: { MaHDHD: hd.MaHDHD },
        include: [{ model: TrangThai, as: 'TrangThai' }],
        order: [['ThoiGianThayDoi', 'DESC']]
      });
      const tMoiNhat = lichSu[0] || null;
      const tongTien = chiTietHoaDon.filter(ct => ct.MaHDHD === hd.MaHDHD).reduce((s, ct) => s + (Number(ct.DonGia) || 0), 0);

      result.push({
        maHDHD: hd.MaHDHD,
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

router.post('/api/cap-nhat-trang-thai-hoa-don', async (req, res) => {
    try {
        const { maHDHD, maTT, ghiChu } = req.body;
        await LS_TTHDHD.create({
            MaHDHD: parseInt(maHDHD),
            MaTT: parseInt(maTT),
            ThoiGianThayDoi: new Date(),
            GhiChu: ghiChu || 'Cập nhật từ Workspace'
        });
        res.json({ success: true, message: 'Đã cập nhật trạng thái hóa đơn!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;