// services/admin/hopDongService.js
const emailService = require('../emailService');
const repo = require('../../repositories/admin/hopDongRepository');
const { KhachHang, CanHo } = require('../../models');
const fs = require('fs');
const path = require('path');

class HopDongService {
    _deleteFile(url) {
        if (url) {
            const p = path.join(__dirname, '../../../../public', url);
            if (fs.existsSync(p)) fs.unlinkSync(p);
        }
    }

    _tinhSoTuKhop(hd, tuKhoaArray) {
        let diem = 0;
        const tenKH = ((hd.KhachHang && hd.KhachHang.TenKH) || '').toLowerCase().split(/\s+/).filter(Boolean);
        const tenCH = ((hd.CanHo && hd.CanHo.TenCanHo) || '').toLowerCase().split(/\s+/).filter(Boolean);
        for (const tu of tuKhoaArray) {
            if (tenKH.includes(tu)) diem += 2;
            if (tenCH.includes(tu)) diem += 1;
        }
        return diem;
    }

    _tinhSoKyTuKhop(hd, tuKhoa) {
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

    async getMasterData() {
        const [khachHangs, canHos, loaiHDs, vaiTroHDs, nhanViens] = await repo.getMasterData();
        return {
            khachHangs: khachHangs.map(k => ({ maKH: k.MaKH, tenKH: k.TenKH, sdt: k.DTKH })),
            canHos: canHos.map(c => ({ maCanHo: c.MaCanHo, tenCanHo: c.TenCanHo, tenTang: c.Tang?.TenTang, tenToaNha: c.Tang?.ToaNha?.TenToaNha })),
            loaiHDs: loaiHDs.map(l => ({ maLoaiHD: l.MaLoaiHD, tenLoai: l.TenLoai })),
            // LƯU Ý: Lấy MaVaitroHD (t thường) từ model VaiTroHD để map sang MaVaiTroHD cho View
            vaiTroHDs: vaiTroHDs.map(v => ({ maVaiTroHD: v.MaVaitroHD, tenVaiTro: v.TenVaiTro })),
            nhanViens: nhanViens.map(n => ({ maNV: n.MaNV, tenNV: n.TenNV }))
        };
    }

    async getList(query) {
        const { search = '', trangThai = 'tatCa', loaiHD = '', vaiTro = '', sortLap = 'macDinh', sortXuLy = 'macDinh', page = 1, limit = 10 } = query;
        let hopDongs = await repo.getAllWithIncludes();
        hopDongs = hopDongs.map(h => h.get({ plain: true }));

        if (trangThai === 'null') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === null);
        else if (trangThai === 'true') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === true);
        else if (trangThai === 'false') hopDongs = hopDongs.filter(hd => hd.TrangThaiHD === false);

        if (loaiHD) hopDongs = hopDongs.filter(hd => hd.MaLoaiHD == loaiHD);
        if (vaiTro) hopDongs = hopDongs.filter(hd => hd.VaiTroHD?.TenVaiTro == vaiTro);

        if (sortLap === 'moiNhat') hopDongs.sort((a, b) => new Date(b.NgayLap) - new Date(a.NgayLap));
        else if (sortLap === 'cuNhat') hopDongs.sort((a, b) => new Date(a.NgayLap) - new Date(b.NgayLap));

        if (sortXuLy === 'somNhat') hopDongs.sort((a, b) => new Date(a.NgayXuLyDuKien || 0) - new Date(b.NgayXuLyDuKien || 0));
        else if (sortXuLy === 'treNhat') hopDongs.sort((a, b) => new Date(b.NgayXuLyDuKien || 0) - new Date(a.NgayXuLyDuKien || 0));
        else if (sortLap === 'macDinh') hopDongs.sort((a, b) => b.MaHopDong - a.MaHopDong);

        let ketQuaTimKiem = null, suggestions = [];
        if (search) {
            if (search.includes(',')) {
                const ids = search.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                const found = hopDongs.filter(hd => ids.includes(hd.MaHopDong));
                if (found.length > 0) hopDongs = found;
                else { ketQuaTimKiem = 'Không tìm thấy mã HĐ.'; suggestions = hopDongs.slice(0, 3); hopDongs = []; }
            } else {
                const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
                const scored = hopDongs.map(hd => ({ hd, diem: this._tinhSoTuKhop(hd, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
                if (scored.length > 0) hopDongs = scored.map(x => x.hd);
                else { ketQuaTimKiem = 'Không có hợp đồng liên quan.'; suggestions = hopDongs.slice(0, 3); hopDongs = []; }
            }
        }

        return { data: hopDongs.slice((page - 1) * limit, page * limit), totalItems: hopDongs.length, totalPages: Math.ceil(hopDongs.length / limit), currentPage: parseInt(page), message: ketQuaTimKiem, suggestions };
    }

    async getSuggestions(term) {
        if (!term) return [];
        let hopDongs = await repo.getAllWithIncludes();
        hopDongs = hopDongs.map(h => h.get({ plain: true }));
        return hopDongs.map(hd => ({ hd, diem: this._tinhSoKyTuKhop(hd, term.toLowerCase()) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 3).map(x => x.hd);
    }

    async getDetail(id) { return await repo.getById(id); }

    async create(dto, files) {
        const err = dto.validate();
        if (err) throw new Error(err);

        const UrlAnhHD = files && files['urlAnhHD'] ? '/images/anhhopdong/' + files['urlAnhHD'][0].filename : null;

        // MAPPING: Đảm bảo key truyền vào repo là "MaVaiTroHD" (T hoa) để khớp Model HopDong.js
        const contractData = {
            MaKH: dto.MaKH,
            MaCanHo: dto.MaCanHo,
            MaLoaiHD: dto.MaLoaiHD,
            MaVaiTroHD: dto.MaVaiTroHD, // Đã khớp T hoa
            MaNV: dto.MaNV,
            GiaTriCanHo: dto.GiaTriCanHo,
            GiaThoaThuan: dto.GiaThoaThuan,
            NgayLap: dto.NgayLap,
            NgayXuLyDuKien: dto.NgayXuLyDuKien,
            NgayHieuLuc: dto.NgayHieuLuc,
            NgayHetHan: dto.NgayHetHan,
            DiaChiKyHopDong: dto.DiaChiKyHopDong,
            SDTNhanLienLac: dto.SDTNhanLienLac,
            UrlAnhHD: UrlAnhHD,
            TrangThaiHD: dto.TrangThaiHD
        };

        const hd = await repo.create(contractData);

        if (files && files['additionalImages']) {
            for (const img of files['additionalImages']) {
                await repo.createDSA({ MaHopDong: hd.MaHopDong, UrlAnh: '/images/dsanhhopdong/' + img.filename });
            }
        }

        try {
            const kh = await KhachHang.findByPk(dto.MaKH);
            const ch = await CanHo.findByPk(dto.MaCanHo);
            if (kh && kh.EmailKH) {
                // Đẩy vào background không đợi (không dùng await) để tránh làm chậm response
                emailService.sendContractCreatedEmail(kh.EmailKH, kh.TenKH, hd.MaHopDong, ch?.TenCanHo || 'Căn hộ', dto.GiaThoaThuan);
            }
        } catch (e) { console.error("Lỗi gửi email tạo HĐ:", e); }


        return hd.MaHopDong;
    }

    async update(id, dto, files) {
        const hd = await repo.getById(id);
        if (!hd) throw new Error('Không tìm thấy');

        let UrlAnhHD = hd.UrlAnhHD;
        if (files && files['urlAnhHD']) {
            this._deleteFile(hd.UrlAnhHD);
            UrlAnhHD = '/images/anhhopdong/' + files['urlAnhHD'][0].filename;
        }

        if (dto.DSA_HopDongToDelete) {
            const idsToDelete = Array.isArray(dto.DSA_HopDongToDelete) ? dto.DSA_HopDongToDelete : [dto.DSA_HopDongToDelete];
            for (const maAnh of idsToDelete) {
                const anh = await repo.getDSAById(maAnh);
                if (anh) { this._deleteFile(anh.UrlAnh); await anh.destroy(); }
            }
        }

        if (files && files['additionalImages']) {
            for (const img of files['additionalImages']) await repo.createDSA({ MaHopDong: hd.MaHopDong, UrlAnh: '/images/dsanhhopdong/' + img.filename });
        }

        // MAPPING cho Update
        const updateData = {
            MaKH: dto.MaKH,
            MaCanHo: dto.MaCanHo,
            MaLoaiHD: dto.MaLoaiHD,
            MaVaiTroHD: dto.MaVaiTroHD, // Đã khớp T hoa
            MaNV: dto.MaNV,
            GiaTriCanHo: dto.GiaTriCanHo,
            GiaThoaThuan: dto.GiaThoaThuan,
            NgayLap: dto.NgayLap,
            NgayXuLyDuKien: dto.NgayXuLyDuKien,
            NgayHieuLuc: dto.NgayHieuLuc,
            NgayHetHan: dto.NgayHetHan,
            DiaChiKyHopDong: dto.DiaChiKyHopDong,
            SDTNhanLienLac: dto.SDTNhanLienLac,
            UrlAnhHD: UrlAnhHD,
            TrangThaiHD: dto.TrangThaiHD
        };

        await hd.update(updateData);
    }

    async deleteMultiple(ids) {
        for (const id of ids) {
            const hd = await repo.getById(id);
            if (!hd) continue;

            // CHỐT CHẶN 1: Nếu hợp đồng đã ký (true)
            if (hd.TrangThaiHD === true) {
                throw new Error(`Hợp đồng #${id} đã được ký kết chính thức. Không được xóa chứng từ pháp lý này.`);
            }

            // CHỐT CHẶN 2: Nếu đã phát sinh hóa đơn tài chính liên quan
            const invoiceCount = await repo.countInvoicesGenerated(id);
            if (invoiceCount > 0) {
                throw new Error(`Hợp đồng #${id} đã phát sinh ${invoiceCount} hóa đơn tài chính. Để bảo vệ dữ liệu Thuế, bạn không được xóa.`);
            }

            // Nếu vượt qua 2 chốt chặn trên mới thực hiện xóa
            this._deleteFile(hd.UrlAnhHD);
            const dsanh = hd.DSA_HopDongS || [];
            for (const dsa of dsanh) this._deleteFile(dsa.UrlAnh);
            await hd.destroy();
        }
    }

    async toggleStatus(id, statusVal) {
        const hd = await repo.getById(id);
        if (hd) await hd.update({ TrangThaiHD: statusVal === 'true' || statusVal === true });
    }

    async bulkUpdateStatus(ids, statusVal) {
        const status = statusVal === 'null' ? null : (statusVal === 'true');
        for (const id of ids) {
            const hd = await repo.getById(id);
            if (hd) await hd.update({ TrangThaiHD: status });
        }
    }
}
module.exports = new HopDongService();