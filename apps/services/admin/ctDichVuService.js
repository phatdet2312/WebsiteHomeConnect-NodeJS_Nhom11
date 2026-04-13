// services/admin/ctDichVuService.js
const repo = require('../../repositories/admin/ctDichVuRepository');
const emailService = require('../emailService');
const { KhachHang, HopDong, DichVu } = require('../../models');
class CTDichVuService {
    async getAllServices() { return await repo.getAllDichVu(); }

    async getWorkspaceData(maDV) {
        const ctList = await repo.getWorkspaceData(maDV);
        if (!ctList.length) return [];

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
            const lsMoiNhat = await repo.getLatestLS(maDV, parseInt(maCanHo), kyMoiNhat.MaKy);

            if (lsMoiNhat) {
                tenTrangThai = lsMoiNhat.TrangThai ? lsMoiNhat.TrangThai.TenTT : 'Không xác định';
                const hd = await repo.getHDById(lsMoiNhat.MaHDDV);
                if (hd) {
                    tenPhuongThuc = hd.PTTT ? hd.PTTT.TenPT : '—';
                    if (hd.KhachHang) { maKHTT = hd.KhachHang.MaKH; tenKHTT = hd.KhachHang.TenKH; }
                }
            }

            const danhSachKy = [];
            for (const ct of cts) {
                let ttKy = 'Chưa thanh toán', ptKy = '—', maKHMini = 0, tenKHMini = '?', ngayThayDoi = null;
                const lsKy = await repo.getLatestLS(maDV, parseInt(maCanHo), ct.MaKy);
                if (lsKy) {
                    ttKy = lsKy.TrangThai ? lsKy.TrangThai.TenTT : 'Không xác định';
                    ngayThayDoi = lsKy.ThoiGianThayDoi ? new Date(lsKy.ThoiGianThayDoi).toLocaleString('vi-VN') : null;
                    const hdKy = await repo.getHDById(lsKy.MaHDDV);
                    if (hdKy) {
                        ptKy = hdKy.PTTT ? hdKy.PTTT.TenPT : '—';
                        if (hdKy.KhachHang) { maKHMini = hdKy.KhachHang.MaKH; tenKHMini = hdKy.KhachHang.TenKH; }
                    }
                }
                danhSachKy.push({
                    maKy: ct.MaKy, tenKy: ct.Ky ? ct.Ky.TenKy : '?',
                    gia: ct.Gia || 0, ngayDenHan: ct.NgayDenHan ? new Date(ct.NgayDenHan).toISOString().split('T')[0] : null,
                    ghiChu: ct.GhiChu || '', urlAnh: ct.urlAnh || null,
                    trangThaiHienThi: `${ttKy} (${ptKy})`, trangThaiKy: ttKy, phuongThucKy: ptKy,
                    maKHmini: maKHMini, tenKHMini: tenKHMini, ngayThayDoi: ngayThayDoi
                });
            }
            danhSachKy.sort((a, b) => a.maKy - b.maKy);

            result.push({
                maDV: maDV, maCanHo: parseInt(maCanHo),
                tenCanHo: first.CanHo ? first.CanHo.TenCanHo : '?',
                tenTang: first.CanHo && first.CanHo.Tang ? first.CanHo.Tang.TenTang : '?',
                tenToaNha: first.CanHo && first.CanHo.Tang && first.CanHo.Tang.ToaNha ? first.CanHo.Tang.ToaNha.TenToaNha : '?',
                ngayThanhToanMoiNhat: lsMoiNhat ? new Date(lsMoiNhat.ThoiGianThayDoi).toLocaleString('vi-VN') : null,
                tenTrangThai, tenPhuongThuc, maKHThanhToan: maKHTT, tenKHThanhToan: tenKHTT, danhSachKy,
                kyMoiNhat: { maKy: kyMoiNhat.MaKy, tenKy: kyMoiNhat.Ky ? kyMoiNhat.Ky.TenKy : '?', gia: kyMoiNhat.Gia || 0, ngayDenHan: kyMoiNhat.NgayDenHan ? new Date(kyMoiNhat.NgayDenHan).toLocaleDateString('vi-VN') : null }
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
            kys: kys.map(k => ({ maKy: k.MaKy, tenKy: k.TenKy })),
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

    async processGanKyHangLoat(dto, files) {
        const err = dto.validate(); if (err) throw new Error(err);
        let anhIndex = 0;
        for (let i = 0; i < dto.dsCanHo.length; i++) {
            const maCH = parseInt(dto.dsCanHo[i]);
            let urlAnh = null;
            if (dto.dsMaAnh.includes(maCH) && anhIndex < files.length) {
                urlAnh = '/images/anhminhchung/' + files[anhIndex].filename;
                anhIndex++;
            }
            const existing = await repo.findCT(dto.maDV, maCH, dto.maKy);
            const payload = { Gia: parseInt(dto.dsGia[i]) || 0, NgayDenHan: dto.dsHan[i] || null, GhiChu: dto.dsGhiChu[i] || null, urlAnh: urlAnh || (existing ? existing.urlAnh : null) };
            if (existing) await existing.update(payload);
            else await repo.createCT({ MaDV: dto.maDV, MaCanHo: maCH, MaKy: dto.maKy, ...payload });
        }

        try {
            const dv = await DichVu.findByPk(dto.maDV);
            // Tìm tất cả khách hàng đang thuê/mua các căn hộ này để gửi mail
            const hopDongs = await HopDong.findAll({
                where: { MaCanHo: dto.dsCanHo, TrangThaiHD: true },
                include: [{ model: KhachHang, as: 'KhachHang' }]
            });
            const sentEmails = new Set();
            for (const hd of hopDongs) {
                const kh = hd.KhachHang;
                if (kh && kh.EmailKH && !sentEmails.has(kh.EmailKH)) {
                    emailService.sendNewInvoiceAlert(kh.EmailKH, kh.TenKH, dv?.TenDV || 'Dịch vụ', dto.dsCanHo.length, 0, dto.dsHan[0]);
                    sentEmails.add(kh.EmailKH); // Đảm bảo 1 khách chỉ nhận 1 mail dù gán nhiều căn hộ
                }
            }
        } catch (e) { console.error("Lỗi gửi email gán phí DV:", e); }
        return dto.dsCanHo.length;
    }

    async processCapNhatInline(dto) {
        const ct = await repo.findCT(dto.maDV, dto.maCanHo, dto.maKy);
        if (!ct) throw new Error('Không tìm thấy!');
        await ct.update({ Gia: dto.gia, NgayDenHan: dto.ngayDenHan, GhiChu: dto.ghiChu });
    }

    async processXoaCT(dto) {
        // Kiểm tra xem đã có bản ghi trong CT_HDDV (đã tạo hóa đơn) chưa
        const count = await repo.countCTHDDV(dto.maDV, dto.maCanHo, dto.maKy);
        if (count > 0) {
            // Lấy danh sách hóa đơn chứa chi tiết này
            const chiTietHoaDons = await repo.getChiTietHoaDon(dto.maDV, dto.maCanHo, dto.maKy);
            for (const ct of chiTietHoaDons) {
                const status = await repo.getLatestStatusName(ct.MaHDDV);
                if (status === 'Đã thanh toán') {
                    throw new Error(`Kỳ dịch vụ này đã nằm trong Hóa đơn #${ct.MaHDDV} đã thanh toán. Không thể xóa dữ liệu gốc.`);
                }
            }
            throw new Error('Dữ liệu này đã được xuất hóa đơn. Vui lòng Hủy hóa đơn trước khi thực hiện thao tác này.');
        }
        await repo.deleteCT(dto.maDV, dto.maCanHo, dto.maKy);
    }

    async processThaoTacKy(dto) {
        if (dto.action === 'add') await repo.createKy({ TenKy: dto.tenKy });
        else if (dto.action === 'edit') await repo.updateKy(dto.maKy, { TenKy: dto.tenKy });
        else if (dto.action === 'delete') {
            const inUse = await repo.countKyUsage(dto.maKy);
            if (inUse > 0) throw new Error('Kỳ đang được sử dụng, không thể xóa!');
            await repo.deleteKy(dto.maKy);
        }
    }

    async getChiTietThanhToan(maDV, maCanHo, maKy) {
        const chiTietHoaDon = await repo.getChiTietHoaDon(maDV, maCanHo, maKy);
        if (!chiTietHoaDon.length) return { daThanhToan: false, message: 'Chưa có thanh toán nào cho kỳ này.' };

        const maHDDVList = [...new Set(chiTietHoaDon.map(ct => ct.MaHDDV))];
        const hoaDons = await repo.getHoaDonsByIds(maHDDVList);

        const result = [];
        for (const hd of hoaDons) {
            const lichSu = await repo.getLichSuHoaDon(hd.MaHDDV);
            const tMoiNhat = lichSu[0] || null;
            const tongTien = chiTietHoaDon.filter(ct => ct.MaHDDV === hd.MaHDDV).reduce((s, ct) => s + (Number(ct.DonGia) || 0), 0);

            result.push({
                maHDDV: hd.MaHDDV, ngayThanhToan: hd.NgayThanhToan ? new Date(hd.NgayThanhToan).toLocaleString('vi-VN') : '',
                phuongThuc: hd.PTTT ? hd.PTTT.TenPT : 'Chưa xác định', tongTien,
                trangThai: tMoiNhat && tMoiNhat.TrangThai ? tMoiNhat.TrangThai.TenTT : 'Không xác định',
                trangThaiMau: tMoiNhat && tMoiNhat.MaTT === 6 ? 'success' : 'warning',
                lichSu: lichSu.map(ls => ({ thoiGian: ls.ThoiGianThayDoi ? new Date(ls.ThoiGianThayDoi).toLocaleString('vi-VN') : '', trangThai: ls.TrangThai ? ls.TrangThai.TenTT : '', ghiChu: ls.GhiChu || '' }))
            });
        }
        return { daThanhToan: true, hoaDons: result };
    }

    async processCapNhatTrangThaiHoaDon(dto) {
        await repo.createLS_TTHDDV({ MaHDDV: dto.maHD, MaTT: dto.maTT, ThoiGianThayDoi: new Date(), GhiChu: dto.ghiChu });
    }
}
module.exports = new CTDichVuService();