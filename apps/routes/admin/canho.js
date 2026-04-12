const express = require('express');
const router = express.Router();
const {
  CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT,
  TrangThai, PTTT, DSA_CanHo, Phong, DSA_Phong,
  HopDong, KhachHang, VaiTroHD
} = require('../../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
 
// --- Cấu hình Multer Đa luồng ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'anhchinhcanho';
    if (file.fieldname === 'additionalImages') folder = 'dsanhcanho';
    if (file.fieldname.startsWith('AnhPhong_')) folder = 'dsanhphong';
    
    const dir = path.join(__dirname, '../../../public/images', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } }).any();

// --- Thuật toán tìm kiếm C# ---
function tinhSoTuKhop(ch, tuKhoaArray) {
    let diem = 0;
    const ten = ` ${(ch.TenCanHo || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
    const mt = ` ${(ch.MoTa || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
    for (const tu of tuKhoaArray) {
        if (ten.includes(tu)) diem += 2;
        else if (mt.includes(tu)) diem += 1;
    }
    return diem;
}
function tinhSoKyTuKhop(ch, tuKhoa) {
    let diem = 0;
    const ten = (ch.TenCanHo || '').toLowerCase();
    const mt = (ch.MoTa || '').toLowerCase();
    const parts = tuKhoa.split(/\s+/).filter(Boolean);
    for (const tu of parts) {
        if (ten.includes(tu)) diem += tu.length * 2;
        else if (mt.includes(tu)) diem += tu.length;
    }
    return diem;
}

// ============================================================================
// 1. ROUTES GIAO DIỆN
// ============================================================================
router.get('/', (req, res) => res.render('admin/canho/index', { title: 'Quản lý Căn hộ', layout: 'layouts/admin' }));
router.get('/add', (req, res) => res.render('admin/canho/add', { title: 'Thêm Căn hộ', layout: 'layouts/admin' }));
router.get('/update/:id', (req, res) => res.render('admin/canho/update', { title: 'Cập nhật Căn hộ', layout: 'layouts/admin', id: req.params.id }));
router.get('/display/:id', (req, res) => res.render('admin/canho/display', { title: 'Chi tiết Căn hộ', layout: 'layouts/admin', id: req.params.id }));

// ============================================================================
// 2. API ENDPOINTS
// ============================================================================

router.get('/api/metadata', async (req, res) => {
    try {
        const [toaNhas, tangs, hienTrangs, mucTTs] = await Promise.all([
            ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }),
            Tang.findAll({ include: [{ model: ToaNha, attributes: ['TenToaNha'] }], order: [['TenTang', 'ASC']] }),
            HienTrang.findAll({ order: [['TenHienTrang', 'ASC']] }),
            TTTTvaMucTT.findAll({ order: [['Ten', 'ASC']] })
        ]);
        res.json({
            success: true,
            toaNhas: toaNhas.map(t => ({ maToaNha: t.MaToaNha, tenToaNha: t.TenToaNha })),
            tangs: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang, maToaNha: t.MaToaNha, tenToaNha: t.ToaNha?.TenToaNha })),
            hienTrangs: hienTrangs.map(h => ({ maHT: h.MaHienTrang, tenHT: h.TenHienTrang, mucDo: h.MucDo })),
            mucTTs: mucTTs.map(m => ({ maMucTT: m.MaMucTT, ten: m.Ten, mucDo: m.MucDo }))
        });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/list', async (req, res) => {
    try {
        const { search='', status='tatCa', deXuat='tatCa', maToaNha='', maTang='', maHienTrang='', maMucTT='', sortGia='macDinh', sortViTri='macDinh', page=1, limit=10 } = req.query;

        const where = {};
        if (status === 'batHienThi') where.TTHienThi = true;
        else if (status === 'tatHienThi') where.TTHienThi = false;

        if (deXuat === 'batDeXuat') where.TTDeXuat = true;
        else if (deXuat === 'tatDeXuat') where.TTDeXuat = false;

        if (maTang && !isNaN(maTang)) where.MaTang = parseInt(maTang);
        if (maHienTrang && !isNaN(maHienTrang)) where.MaHienTrang = parseInt(maHienTrang);
        if (maMucTT && !isNaN(maMucTT)) where.MaMucTT = parseInt(maMucTT);

        const tangInclude = {
            model: Tang, as: 'Tang', attributes: ['MaTang', 'TenTang', 'MaToaNha'],
            include: [{ model: ToaNha, attributes: ['MaToaNha', 'TenToaNha'] }]
        };
        if (maToaNha && !maTang) {
            tangInclude.where = { MaToaNha: parseInt(maToaNha) };
            tangInclude.required = true;
        }

        let canHos = await CanHo.findAll({
            where,
            include: [
                tangInclude,
                { model: HienTrang, as: 'HienTrang', attributes: ['TenHienTrang', 'MucDo'] },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT', attributes: ['Ten', 'MucDo'] },
                { model: Phong, as: 'Phongs', attributes: ['MaPhong'] },
                { model: HopDong, required: false, where: { TrangThaiHD: true }, 
                  include: [{ model: KhachHang, as: 'KhachHang', attributes: ['TenKH'] }, { model: VaiTroHD, as: 'VaiTroHD', attributes: ['TenVaiTro'] }] 
                }
            ],
            order: [['MaCanHo', 'DESC']]
        });

        canHos = canHos.map(c => c.toJSON());

        if (sortGia === 'thapDenCao') canHos.sort((a, b) => (a.Gia||0) - (b.Gia||0));
        else if (sortGia === 'caoDenThap') canHos.sort((a, b) => (b.Gia||0) - (a.Gia||0));
        if (sortViTri === 'tangDan') canHos.sort((a, b) => (a.ViTriDay||0) - (b.ViTriDay||0));
        else if (sortViTri === 'giamDan') canHos.sort((a, b) => (b.ViTriDay||0) - (a.ViTriDay||0));

        let ketQuaTimKiem = null, suggestions = [];
        if (search) {
            if (search.includes(',')) {
                const ids = search.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                const found = canHos.filter(ch => ids.includes(ch.MaCanHo));
                if (found.length > 0) canHos = found;
                else { ketQuaTimKiem = 'Không tìm thấy mã căn hộ.'; suggestions = canHos.slice(0, 3); canHos = []; }
            } else {
                const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
                const scored = canHos.map(ch => ({ ch, diem: tinhSoTuKhop(ch, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
                if (scored.length > 0) canHos = scored.map(x => x.ch);
                else { ketQuaTimKiem = 'Không có căn hộ liên quan.'; suggestions = canHos.slice(0, 3); canHos = []; }
            }
        }

        const totalItems = canHos.length;
        const paginatedData = canHos.slice((page - 1) * limit, page * limit);

        res.json({ success: true, data: paginatedData, totalItems, totalPages: Math.ceil(totalItems / limit), currentPage: parseInt(page), message: ketQuaTimKiem, suggestions });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/suggestions', async (req, res) => {
    try {
        const term = (req.query.term || '').toLowerCase();
        if (!term) return res.json({ success: true, data: [] });
        let canHos = await CanHo.findAll({ include: [{ model: Tang, as: 'Tang', include: [ToaNha] }] });
        const scored = canHos.map(ch => ({ ch: ch.toJSON(), diem: tinhSoKyTuKhop(ch, term) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 5);
        res.json({ success: true, data: scored.map(x => x.ch) });
    } catch (err) { res.json({ success: false, data: [] }); }
});

router.get('/api/detail/:id', async (req, res) => {
    try {
        const item = await CanHo.findByPk(req.params.id, {
            include: [
                { model: Tang, as: 'Tang', include: [{ model: ToaNha }] },
                { model: HienTrang, as: 'HienTrang' },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT' },
                { model: DSA_CanHo, as: 'DSA_CanHos' },
                { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
                { model: HopDong, required: false, where: { TrangThaiHD: true }, include: [{ model: KhachHang, as: 'KhachHang' }, { model: VaiTroHD, as: 'VaiTroHD' }] }
            ]
        });
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy căn hộ' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/add', upload, async (req, res) => {
    try {
        const d = req.body;
        const mainFile = req.files.find(f => f.fieldname === 'UrlAnh');
        const UrlAnh = mainFile ? '/images/anhchinhcanho/' + mainFile.filename : null;

        const ch = await CanHo.create({
            TenCanHo: d.TenCanHo, MaTang: parseInt(d.MaTang),
            MaHienTrang: d.MaHienTrang ? parseInt(d.MaHienTrang) : null,
            MaMucTT: d.MaMucTT ? parseInt(d.MaMucTT) : null,
            ViTriDay: parseInt(d.ViTriDay) || 1, ThuTu: parseInt(d.ThuTu) || 1,
            Gia: d.Gia ? parseInt(d.Gia) : null, GiaThue: d.GiaThue ? parseInt(d.GiaThue) : null,
            MoTa: d.MoTa || null, Dai: d.Dai ? parseFloat(d.Dai) : null,
            Rong: d.Rong ? parseFloat(d.Rong) : null, Cao: d.Cao ? parseFloat(d.Cao) : null,
            TamNhin: d.TamNhin || null, UrlAnh: UrlAnh,
            TTDeXuat: d.TTDeXuat === 'true', TTHienThi: d.TTHienThi === 'true'
        });

        const galleryFiles = req.files.filter(f => f.fieldname === 'additionalImages');
        for (const file of galleryFiles) {
            await DSA_CanHo.create({ MaCanHo: ch.MaCanHo, UrlAnh: '/images/dsanhcanho/' + file.filename });
        }

        let dsTenPhong = d.TenPhongList;
        if (dsTenPhong) {
            dsTenPhong = Array.isArray(dsTenPhong) ? dsTenPhong : [dsTenPhong];
            for (let i = 0; i < dsTenPhong.length; i++) {
                const ten = dsTenPhong[i].trim();
                if (!ten) continue;
                const phong = await Phong.create({ MaCanHo: ch.MaCanHo, TenPhong: ten, TTHienThi: true, TTDeXuat: false });
                const anhPhongs = req.files.filter(f => f.fieldname === `AnhPhong_${i}`);
                for (const img of anhPhongs) {
                    await DSA_Phong.create({ MaPhong: phong.MaPhong, UrlAnh: '/images/dsanhphong/' + img.filename });
                }
            }
        }

        res.json({ success: true, message: 'Thêm căn hộ thành công!', id: ch.MaCanHo });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/update/:id', upload, async (req, res) => {
    try {
        const item = await CanHo.findByPk(req.params.id, { include: [{ model: DSA_CanHo }, { model: Phong, include: [DSA_Phong] }] });
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });

        const d = req.body;
        let UrlAnh = item.UrlAnh;
        const mainFile = req.files.find(f => f.fieldname === 'UrlAnh');
        if (mainFile) {
            if (item.UrlAnh) {
                const oldPath = path.join(__dirname, '../../../public', item.UrlAnh);
                if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            }
            UrlAnh = '/images/anhchinhcanho/' + mainFile.filename;
        }

        await item.update({
            TenCanHo: d.TenCanHo, MaTang: parseInt(d.MaTang),
            MaHienTrang: d.MaHienTrang ? parseInt(d.MaHienTrang) : null,
            MaMucTT: d.MaMucTT ? parseInt(d.MaMucTT) : null,
            ViTriDay: parseInt(d.ViTriDay) || 1, ThuTu: parseInt(d.ThuTu) || 1,
            Gia: d.Gia ? parseInt(d.Gia) : null, GiaThue: d.GiaThue ? parseInt(d.GiaThue) : null,
            MoTa: d.MoTa || null, Dai: d.Dai ? parseFloat(d.Dai) : null,
            Rong: d.Rong ? parseFloat(d.Rong) : null, Cao: d.Cao ? parseFloat(d.Cao) : null,
            TamNhin: d.TamNhin || null, UrlAnh: UrlAnh,
            TTDeXuat: d.TTDeXuat === 'true', TTHienThi: d.TTHienThi === 'true'
        });

        if (d.DSA_CanHoToDelete) {
            const ids = Array.isArray(d.DSA_CanHoToDelete) ? d.DSA_CanHoToDelete : [d.DSA_CanHoToDelete];
            for (const maAnh of ids) {
                const anh = await DSA_CanHo.findByPk(maAnh);
                if (anh) {
                    const p = path.join(__dirname, '../../../public', anh.UrlAnh);
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                    await anh.destroy();
                }
            }
        }

        const galleryFiles = req.files.filter(f => f.fieldname === 'additionalImages');
        for (const file of galleryFiles) {
            await DSA_CanHo.create({ MaCanHo: item.MaCanHo, UrlAnh: '/images/dsanhcanho/' + file.filename });
        }

        if (d.PhongToDelete) {
            const pIds = Array.isArray(d.PhongToDelete) ? d.PhongToDelete : [d.PhongToDelete];
            for (const pid of pIds) {
                const p = await Phong.findByPk(pid, { include: [DSA_Phong] });
                if (p) {
                    for (const a of p.DSA_Phongs) {
                        const pImg = path.join(__dirname, '../../../public', a.UrlAnh);
                        if (fs.existsSync(pImg)) fs.unlinkSync(pImg);
                    }
                    await p.destroy();
                }
            }
        }

        if (d.DSA_PhongToDelete) {
            const aIds = Array.isArray(d.DSA_PhongToDelete) ? d.DSA_PhongToDelete : [d.DSA_PhongToDelete];
            for (const aid of aIds) {
                const a = await DSA_Phong.findByPk(aid);
                if(a) {
                    const pImg = path.join(__dirname, '../../../public', a.UrlAnh);
                    if (fs.existsSync(pImg)) fs.unlinkSync(pImg);
                    await a.destroy();
                }
            }
        }

        let dsTenPhong = d.TenPhongList;
        let dsMaPhong = d.MaPhongList; 
        if (dsTenPhong) {
            dsTenPhong = Array.isArray(dsTenPhong) ? dsTenPhong : [dsTenPhong];
            dsMaPhong = Array.isArray(dsMaPhong) ? dsMaPhong : [dsMaPhong];

            for (let i = 0; i < dsTenPhong.length; i++) {
                const ten = dsTenPhong[i].trim();
                const maphong = dsMaPhong[i];
                if (!ten) continue;

                let phongTarget;
                if (maphong && maphong !== 'new') {
                    phongTarget = await Phong.findByPk(maphong);
                    if(phongTarget) await phongTarget.update({ TenPhong: ten });
                } else {
                    phongTarget = await Phong.create({ MaCanHo: item.MaCanHo, TenPhong: ten, TTHienThi: true, TTDeXuat: false });
                }

                const anhPhongs = req.files.filter(f => f.fieldname === `AnhPhong_${i}`);
                for (const img of anhPhongs) {
                    await DSA_Phong.create({ MaPhong: phongTarget.MaPhong, UrlAnh: '/images/dsanhphong/' + img.filename });
                }
            }
        }

        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/delete-multiple', async (req, res) => {
    try {
        const ids = Array.isArray(req.body.ids) ? req.body.ids : (req.body.ids ? req.body.ids.split(',') : []);
        if (!ids.length) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });

        for (const id of ids) {
            const ch = await CanHo.findByPk(id, { include: [DSA_CanHo, { model: Phong, include: [DSA_Phong] }] });
            if (ch) {
                if (ch.UrlAnh) { const p = path.join(__dirname, '../../../public', ch.UrlAnh); if (fs.existsSync(p)) fs.unlinkSync(p); }
                for (const dsa of ch.DSA_CanHos) { const p = path.join(__dirname, '../../../public', dsa.UrlAnh); if (fs.existsSync(p)) fs.unlinkSync(p); }
                for (const p of ch.Phongs) {
                    for (const pa of p.DSA_Phongs) { const pImg = path.join(__dirname, '../../../public', pa.UrlAnh); if (fs.existsSync(pImg)) fs.unlinkSync(pImg); }
                }
                await ch.destroy();
            }
        }
        res.json({ success: true, message: `Đã xóa ${ids.length} căn hộ` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// FIX LỖI TOGGLE STATUS: Ép kiểu string 'true' / boolean true một cách chặt chẽ
router.post('/api/change-status/:id', async (req, res) => {
    try {
        const item = await CanHo.findByPk(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
        
        // Khắc phục triệt để lỗi string/boolean từ JS fetch
        const newStatus = req.body.status === true || req.body.status === 'true';
        
        if (req.body.type === 'dexuat') await item.update({ TTDeXuat: newStatus });
        else await item.update({ TTHienThi: newStatus });
        
        res.json({ success: true, message: 'Cập nhật thành công' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/api/bulk-update', async (req, res) => {
    try {
        const { ids, type, value } = req.body;
        const idArray = Array.isArray(ids) ? ids : (ids ? ids.split(',') : []);
        if (!idArray.length) return res.status(400).json({ success: false, message: 'Chưa chọn căn hộ' });

        const payload = {};
        if (type === 'tang') payload.MaTang = parseInt(value);
        else if (type === 'hientrang') payload.MaHienTrang = value ? parseInt(value) : null;
        else if (type === 'muctt') payload.MaMucTT = value ? parseInt(value) : null;
        else if (type === 'hienthi') payload.TTHienThi = value === 'true' || value === true;
        else if (type === 'dexuat') payload.TTDeXuat = value === 'true' || value === true;

        await CanHo.update(payload, { where: { MaCanHo: idArray } });
        res.json({ success: true, message: `Đã cập nhật hàng loạt cho ${idArray.length} căn hộ.` });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.get('/api/anh-phong/:id', async (req, res) => {
    const p = await Phong.findByPk(req.params.id, { include: [DSA_Phong] });
    if(p) res.json({ success: true, data: p.DSA_Phongs });
    else res.json({ success: false });
});

module.exports = router;