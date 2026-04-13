const repo = require('../../repositories/admin/ctThanhToanRepository');

class CTThanhToanService {
    async getAllServices() { return await repo.getAllLoaiTT(); }

    async getWorkspaceData(maLoaiTT) {
        const ctList = await repo.getWorkspaceData(maLoaiTT);
        if (!ctList.length) return [];

        const grouped = {};
        for (const ct of ctList) { const key = ct.MaCanHo; if (!grouped[key]) grouped[key] = []; grouped[key].push(ct); }

        const result = [];
        for (const [maCanHo, cts] of Object.entries(grouped)) {
            const first = cts[0];
            const kyMoiNhat = [...cts].sort((a, b) => b.MaKyTT - a.MaKyTT)[0];

            let tenTrangThai = 'Chưa thanh toán', tenPhuongThuc = '—', maKHTT = 0, tenKHTT = '?';
            const lsMoiNhat = await repo.getLatestLS(maLoaiTT, parseInt(maCanHo), kyMoiNhat.MaKyTT);

            if (lsMoiNhat) {
                tenTrangThai = lsMoiNhat.TrangThai ? lsMoiNhat.TrangThai.TenTT : 'Không xác định';
                const hd = await repo.getHDById(lsMoiNhat.MaHDHD);
                if (hd) {
                    tenPhuongThuc = hd.PTTT ? hd.PTTT.TenPT : '—';
                    if (hd.HopDong && hd.HopDong.KhachHang) { maKHTT = hd.HopDong.KhachHang.MaKH; tenKHTT = hd.HopDong.KhachHang.TenKH; }
                }
            }

            const danhSachKy = [];
            for (const ct of cts) {
                let ttKy = 'Chưa thanh toán', ptKy = '—', maKHMini = 0, tenKHMini = '?', ngayThayDoi = null;
                const lsKy = await repo.getLatestLS(maLoaiTT, parseInt(maCanHo), ct.MaKyTT);
                if (lsKy) {
                    ttKy = lsKy.TrangThai ? lsKy.TrangThai.TenTT : 'Không xác định';
                    ngayThayDoi = lsKy.ThoiGianThayDoi ? new Date(lsKy.ThoiGianThayDoi).toLocaleString('vi-VN') : null;
                    const hdKy = await repo.getHDById(lsKy.MaHDHD);
                    if (hdKy) {
                        ptKy = hdKy.PTTT ? hdKy.PTTT.TenPT : '—';
                        if (hdKy.HopDong && hdKy.HopDong.KhachHang) { maKHMini = hdKy.HopDong.KhachHang.MaKH; tenKHMini = hdKy.HopDong.KhachHang.TenKH; }
                    }
                }
                danhSachKy.push({
                    maKyTT: ct.MaKyTT, tenKyTT: ct.KyTT ? ct.KyTT.TenKyTT : '?',
                    gia: ct.Gia || 0, ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toISOString().split('T')[0] : null,
                    ghiChu: ct.GhiChu || '', trangThaiHienThi: `${ttKy} (${ptKy})`, trangThaiKy: ttKy, phuongThucKy: ptKy,
                    maKHmini: maKHMini, tenKHMini: tenKHMini, ngayThayDoi: ngayThayDoi
                });
            }
            danhSachKy.sort((a, b) => a.maKyTT - b.maKyTT);

            result.push({
                maLoaiTT: maLoaiTT, maCanHo: parseInt(maCanHo),
                tenCanHo: first.CanHoTT ? first.CanHoTT.TenCanHo : '?',
                tenTang: first.CanHoTT && first.CanHoTT.Tang ? first.CanHoTT.Tang.TenTang : '?',
                tenToaNha: first.CanHoTT && first.CanHoTT.Tang && first.CanHoTT.Tang.ToaNha ? first.CanHoTT.Tang.ToaNha.TenToaNha : '?',
                ngayThanhToanMoiNhat: lsMoiNhat ? new Date(lsMoiNhat.ThoiGianThayDoi).toLocaleString('vi-VN') : null,
                tenTrangThai, tenPhuongThuc, maKHThanhToan: maKHTT, tenKHThanhToan: tenKHTT, danhSachKy,
                kyMoiNhat: { maKyTT: kyMoiNhat.MaKyTT, tenKyTT: kyMoiNhat.KyTT ? kyMoiNhat.KyTT.TenKyTT : '?', gia: kyMoiNhat.Gia || 0, ngayDenHan: kyMoiNhat.NgayDenHan ? new Date(kyMoiNhat.NgayDenHan).toLocaleDateString('vi-VN') : null }
            });
        }
        result.sort((a, b) => (a.tenToaNha.localeCompare(b.tenToaNha, 'vi')) || (a.tenTang.localeCompare(b.tenTang, 'vi')) || (a.tenCanHo.localeCompare(b.tenCanHo, 'vi')));
        return result;
    }

    async getMetadata() {
        const [toaNhas, tangs, kys, trangThais] = await repo.getMetadata();
        return {
            toaNhas: toaNhas.map(t => ({ maToaNha: t.MaToaNha, tenToaNha: t.TenToaNha })),
            tangs: tangs.map(t => ({ maTang: t.MaTang, tenTang: t.TenTang, maToaNha: t.MaToaNha })),
            kys: kys.map(k => ({ maKyTT: k.MaKyTT, tenKyTT: k.TenKyTT })),
            trangThais: trangThais.map(tt => ({ maTT: tt.MaTT, tenTT: tt.TenTT }))
        };
    }

    async getTangs(maToaNha) { return await repo.getTangsByToaNha(parseInt(maToaNha)); }
    async getCanHos(maTang, maToaNha) {
        const where = {}; if (maTang) where.MaTang = parseInt(maTang);
        let canHos = await repo.getCanHos(where);
        if (maToaNha && !maTang) canHos = canHos.filter(ch => ch.Tang && ch.Tang.MaToaNha === parseInt(maToaNha));
        return canHos.map(ch => ({ maCanHo: ch.MaCanHo, tenCanHo: ch.TenCanHo, tenTang: ch.Tang ? ch.Tang.TenTang : '', tenToaNha: ch.Tang && ch.Tang.ToaNha ? ch.Tang.ToaNha.TenToaNha : 'Chưa có' }));
    }

    async processGanKyHangLoat(dto) {
        const err = dto.validate(); if (err) throw new Error(err);
        for (let i = 0; i < dto.dsCanHo.length; i++) {
            const maCH = parseInt(dto.dsCanHo[i]);
            const existing = await repo.findCT(dto.maLoaiTT, maCH, dto.maKyTT);
            const payload = { Gia: parseInt(dto.dsGia[i]) || 0, NgayDenHan: dto.dsHan[i] || null, GhiChu: dto.dsGhiChu[i] || null };
            if (existing) await existing.update(payload);
            else await repo.createCT({ MaLoaiTT: dto.maLoaiTT, MaCanHo: maCH, MaKyTT: dto.maKyTT, ...payload });
        }
        return dto.dsCanHo.length;
    }

    async processCapNhatInline(dto) {
        const ct = await repo.findCT(dto.maLoaiTT, dto.maCanHo, dto.maKyTT);
        if (!ct) throw new Error('Không tìm thấy!');
        await ct.update({ Gia: dto.gia, NgayDenHan: dto.ngayDenHan, GhiChu: dto.ghiChu });
    }

    async processXoaCT(dto) {
        const count = await repo.countCTHDHD(dto.maLoaiTT, dto.maCanHo, dto.maKyTT);
        if (count > 0) {
            const chiTietHoaDons = await repo.getChiTietHoaDon(dto.maLoaiTT, dto.maCanHo, dto.maKyTT);
            for (const ct of chiTietHoaDons) {
                const status = await repo.getLatestStatusName(ct.MaHDHD);
                if (status === 'Đã thanh toán') {
                    throw new Error(`Khoản thanh toán này đã nằm trong Hóa đơn #${ct.MaHDHD} đã thanh toán.`);
                }
            }
            throw new Error('Dữ liệu đã phát sinh hóa đơn hợp đồng. Tuyệt đối không được xóa.');
        }
        await repo.deleteCT(dto.maLoaiTT, dto.maCanHo, dto.maKyTT);
    }

    async processThaoTacKy(dto) {
        if (dto.action === 'add') await repo.createKy({ TenKyTT: dto.tenKyTT });
        else if (dto.action === 'edit') await repo.updateKy(dto.maKyTT, { TenKyTT: dto.tenKyTT });
        else if (dto.action === 'delete') {
            const inUse = await repo.countKyUsage(dto.maKyTT);
            if (inUse > 0) throw new Error('Kỳ đang được sử dụng, không thể xóa!');
            await repo.deleteKy(dto.maKyTT);
        }
    }

    async getChiTietThanhToan(maLoaiTT, maCanHo, maKyTT) {
        const chiTietHoaDon = await repo.getChiTietHoaDon(maLoaiTT, maCanHo, maKyTT);
        if (!chiTietHoaDon.length) return { daThanhToan: false, message: 'Chưa có thanh toán nào cho kỳ này.' };

        const maHDHDList = [...new Set(chiTietHoaDon.map(ct => ct.MaHDHD))];
        const hoaDons = await repo.getHoaDonsByIds(maHDHDList);

        const result = [];
        for (const hd of hoaDons) {
            const lichSu = await repo.getLichSuHoaDon(hd.MaHDHD);
            const tMoiNhat = lichSu[0] || null;
            const tongTien = chiTietHoaDon.filter(ct => ct.MaHDHD === hd.MaHDHD).reduce((s, ct) => s + (Number(ct.DonGia) || 0), 0);

            result.push({
                maHDHD: hd.MaHDHD, ngayThanhToan: hd.NgayThanhToan ? new Date(hd.NgayThanhToan).toLocaleString('vi-VN') : '',
                phuongThuc: hd.PTTT ? hd.PTTT.TenPT : 'Chưa xác định', tongTien,
                trangThai: tMoiNhat && tMoiNhat.TrangThai ? tMoiNhat.TrangThai.TenTT : 'Không xác định',
                trangThaiMau: tMoiNhat && tMoiNhat.MaTT === 6 ? 'success' : 'warning',
                lichSu: lichSu.map(ls => ({ thoiGian: ls.ThoiGianThayDoi ? new Date(ls.ThoiGianThayDoi).toLocaleString('vi-VN') : '', trangThai: ls.TrangThai ? ls.TrangThai.TenTT : '', ghiChu: ls.GhiChu || '' }))
            });
        }
        return { daThanhToan: true, hoaDons: result };
    }

    async processCapNhatTrangThaiHoaDon(dto) {
        await repo.createLS_TTHDHD({ MaHDHD: dto.maHD, MaTT: dto.maTT, ThoiGianThayDoi: new Date(), GhiChu: dto.ghiChu });
    }
}
module.exports = new CTThanhToanService();