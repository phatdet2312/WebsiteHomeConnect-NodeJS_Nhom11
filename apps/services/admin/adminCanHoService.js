const repo = require('../../repositories/admin/adminCanHoRepository');
const fs = require('fs');
const path = require('path');
const { Tang, ToaNha } = require('../../models');

class AdminCanHoService {
    _tinhSoTuKhop(ch, tuKhoaArray) {
        let diem = 0;
        const ten = ` ${(ch.TenCanHo || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
        const mt = ` ${(ch.MoTa || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
        for (const tu of tuKhoaArray) {
            if (ten.includes(tu)) diem += 2;
            else if (mt.includes(tu)) diem += 1;
        }
        return diem;
    }
    _tinhSoKyTuKhop(ch, tuKhoa) {
        let diem = 0;
        const ten = (ch.TenCanHo || '').toLowerCase();
        const parts = tuKhoa.split(/\s+/).filter(Boolean);
        for (const tu of parts) {
            if (ten.includes(tu)) diem += tu.length * 2;
        }
        return diem;
    }

    _deleteFile(url) {
        if (url) {
            const p = path.join(__dirname, '../../../../public', url);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
    }

    async getMetadata() { return await repo.getMetadata(); }

    async getList(query) {
        const { search='', status='tatCa', deXuat='tatCa', maToaNha='', maTang='', maHienTrang='', maMucTT='', sortGia='macDinh', sortViTri='macDinh', page=1, limit=10 } = query;
        
        const where = {};
        if (status === 'batHienThi') where.TTHienThi = true;
        else if (status === 'tatHienThi') where.TTHienThi = false;
        if (deXuat === 'batDeXuat') where.TTDeXuat = true;
        else if (deXuat === 'tatDeXuat') where.TTDeXuat = false;
        if (maTang && !isNaN(maTang)) where.MaTang = parseInt(maTang);
        if (maHienTrang && !isNaN(maHienTrang)) where.MaHienTrang = parseInt(maHienTrang);
        if (maMucTT && !isNaN(maMucTT)) where.MaMucTT = parseInt(maMucTT);

        const tangInclude = { model: Tang, as: 'Tang', attributes: ['MaTang', 'TenTang', 'MaToaNha'], include: [{ model: ToaNha, attributes: ['MaToaNha', 'TenToaNha'] }] };
        if (maToaNha && !maTang) { tangInclude.where = { MaToaNha: parseInt(maToaNha) }; tangInclude.required = true; }

        let canHos = await repo.getCanHos(where, tangInclude);
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
                const scored = canHos.map(ch => ({ ch, diem: this._tinhSoTuKhop(ch, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
                if (scored.length > 0) canHos = scored.map(x => x.ch);
                else { ketQuaTimKiem = 'Không có căn hộ liên quan.'; suggestions = canHos.slice(0, 3); canHos = []; }
            }
        }

        return { data: canHos.slice((page - 1) * limit, page * limit), totalItems: canHos.length, totalPages: Math.ceil(canHos.length / limit), message: ketQuaTimKiem, suggestions };
    }

    async getSuggestions(term) {
        if (!term) return [];
        const canHos = await repo.getSuggestionsQuery();
        const scored = canHos.map(ch => ({ ch: ch.toJSON(), diem: this._tinhSoKyTuKhop(ch, term.toLowerCase()) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 5);
        return scored.map(x => x.ch);
    }

    async getDetail(id) { return await repo.getById(id); }

    async create(dto, files) {
        const err = dto.validate();
        if (err) throw new Error(err);

        const mainFile = files.find(f => f.fieldname === 'UrlAnh');
        const UrlAnh = mainFile ? '/images/anhchinhcanho/' + mainFile.filename : null;

        const ch = await repo.createCanHo({ ...dto, UrlAnh });

        const galleryFiles = files.filter(f => f.fieldname === 'additionalImages');
        for (const file of galleryFiles) await repo.createDSACanHo({ MaCanHo: ch.MaCanHo, UrlAnh: '/images/dsanhcanho/' + file.filename });

        let dsTenPhong = dto.TenPhongList;
        if (dsTenPhong) {
            dsTenPhong = Array.isArray(dsTenPhong) ? dsTenPhong : [dsTenPhong];
            for (let i = 0; i < dsTenPhong.length; i++) {
                const ten = dsTenPhong[i].trim();
                if (!ten) continue;
                const phong = await repo.createPhong({ MaCanHo: ch.MaCanHo, TenPhong: ten, TTHienThi: true, TTDeXuat: false });
                const anhPhongs = files.filter(f => f.fieldname === `AnhPhong_${i}`);
                for (const img of anhPhongs) await repo.createDSAPhong({ MaPhong: phong.MaPhong, UrlAnh: '/images/dsanhphong/' + img.filename });
            }
        }
        return ch.MaCanHo;
    }

    async update(id, dto, files) {
        const err = dto.validate();
        if (err) throw new Error(err);

        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy căn hộ');

        let UrlAnh = item.UrlAnh;
        const mainFile = files.find(f => f.fieldname === 'UrlAnh');
        if (mainFile) {
            this._deleteFile(item.UrlAnh);
            UrlAnh = '/images/anhchinhcanho/' + mainFile.filename;
        }

        await item.update({ ...dto, UrlAnh });

        if (dto.DSA_CanHoToDelete) {
            const ids = Array.isArray(dto.DSA_CanHoToDelete) ? dto.DSA_CanHoToDelete : [dto.DSA_CanHoToDelete];
            for (const maAnh of ids) {
                const anh = await repo.getDSA_CanHoById(maAnh);
                if (anh) { this._deleteFile(anh.UrlAnh); await anh.destroy(); }
            }
        }

        const galleryFiles = files.filter(f => f.fieldname === 'additionalImages');
        for (const file of galleryFiles) await repo.createDSACanHo({ MaCanHo: item.MaCanHo, UrlAnh: '/images/dsanhcanho/' + file.filename });

        if (dto.PhongToDelete) {
            const pIds = Array.isArray(dto.PhongToDelete) ? dto.PhongToDelete : [dto.PhongToDelete];
            for (const pid of pIds) {
                const p = await repo.getPhongById(pid);
                if (p) {
                    for (const a of p.DSA_Phongs) { this._deleteFile(a.UrlAnh); }
                    await p.destroy();
                }
            }
        }

        if (dto.DSA_PhongToDelete) {
            const aIds = Array.isArray(dto.DSA_PhongToDelete) ? dto.DSA_PhongToDelete : [dto.DSA_PhongToDelete];
            for (const aid of aIds) {
                const a = await repo.getDSA_PhongById(aid);
                if (a) { this._deleteFile(a.UrlAnh); await a.destroy(); }
            }
        }

        let dsTenPhong = dto.TenPhongList;
        let dsMaPhong = dto.MaPhongList; 
        if (dsTenPhong) {
            dsTenPhong = Array.isArray(dsTenPhong) ? dsTenPhong : [dsTenPhong];
            dsMaPhong = Array.isArray(dsMaPhong) ? dsMaPhong : [dsMaPhong];
            for (let i = 0; i < dsTenPhong.length; i++) {
                const ten = dsTenPhong[i].trim();
                const maphong = dsMaPhong[i];
                if (!ten) continue;

                let phongTarget;
                if (maphong && maphong !== 'new') {
                    phongTarget = await repo.getPhongById(maphong);
                    if(phongTarget) await phongTarget.update({ TenPhong: ten });
                } else {
                    phongTarget = await repo.createPhong({ MaCanHo: item.MaCanHo, TenPhong: ten, TTHienThi: true, TTDeXuat: false });
                }
                const anhPhongs = files.filter(f => f.fieldname === `AnhPhong_${i}`);
                for (const img of anhPhongs) await repo.createDSAPhong({ MaPhong: phongTarget.MaPhong, UrlAnh: '/images/dsanhphong/' + img.filename });
            }
        }
    }

    // ==========================================
    // ĐÃ SỬA: HÀM XÓA CĂN HỘ ĐƯỢC BẢO VỆ CHẶT CHẼ
    // ==========================================
    async deleteMultiple(ids) {
        for (const id of ids) {
            const ch = await repo.getById(id);
            if (!ch) continue; // Bỏ qua nếu không tồn tại

            // 1. Kiểm tra Hợp Đồng
            const checkHD = await repo.countHopDongByCanHo(id);
            if (checkHD > 0) throw new Error(`Không thể xóa căn hộ #${id} vì đã tồn tại Hợp Đồng liên kết.`);

            // 2. Kiểm tra Hóa Đơn Dịch Vụ
            const checkDV = await repo.countHoaDonDichVuByCanHo(id);
            if (checkDV > 0) throw new Error(`Không thể xóa căn hộ #${id} vì đã phát sinh Hóa đơn Dịch vụ.`);

            // 3. Kiểm tra Hóa Đơn Hợp Đồng
            const checkHDHD = await repo.countHoaDonHopDongByCanHo(id);
            if (checkHDHD > 0) throw new Error(`Không thể xóa căn hộ #${id} vì đã phát sinh Hóa đơn Hợp đồng.`);

            // Nếu an toàn, tiến hành xóa ảnh và xóa bảng
            this._deleteFile(ch.UrlAnh);
            for (const dsa of ch.DSA_CanHos) this._deleteFile(dsa.UrlAnh);
            for (const p of ch.Phongs) { for (const pa of p.DSA_Phongs) this._deleteFile(pa.UrlAnh); }
            
            await ch.destroy();
        }
    }

    async toggleStatus(id, type, statusVal) {
        const item = await repo.getById(id);
        if (!item) throw new Error('Không tìm thấy');
        const newStatus = statusVal === true || statusVal === 'true';
        if (type === 'dexuat') await item.update({ TTDeXuat: newStatus });
        else await item.update({ TTHienThi: newStatus });
    }

    async bulkUpdate(ids, type, value) {
        const payload = {};
        if (type === 'tang') payload.MaTang = parseInt(value);
        else if (type === 'hientrang') payload.MaHienTrang = value ? parseInt(value) : null;
        else if (type === 'muctt') payload.MaMucTT = value ? parseInt(value) : null;
        else if (type === 'hienthi') payload.TTHienThi = value === 'true' || value === true;
        else if (type === 'dexuat') payload.TTDeXuat = value === 'true' || value === true;
        await repo.updateBulk(payload, ids);
    }
}
module.exports = new AdminCanHoService();