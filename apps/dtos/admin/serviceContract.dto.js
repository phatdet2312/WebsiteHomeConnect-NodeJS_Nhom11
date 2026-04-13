// Hàm xử lý số an toàn: Chuyển chuỗi rỗng, "undefined" hoặc NaN thành null
const safeParseInt = (val) => {
    if (val === null || val === undefined || val === '' || val === 'undefined') return null;
    const res = parseInt(val);
    return isNaN(res) ? null : res;
};

class DichVuDTO {
    constructor(data) {
        this.TenDV = data.TenDV?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.TenDV) return 'Tên dịch vụ không được để trống';
        return null;
    }
}

class LoaiTTHDDTO {
    constructor(data) {
        this.TenLoaiTT = data.TenLoaiTT?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.TenLoaiTT) return 'Tên loại thanh toán không được để trống';
        return null;
    }
}

class HopDongDTO {
    constructor(data) {
        this.MaKH = safeParseInt(data.MaKH);
        this.MaCanHo = safeParseInt(data.MaCanHo);
        this.MaLoaiHD = safeParseInt(data.MaLoaiHD);
        
        // CHỐT: Dùng MaVaiTroHD (T hoa) để khớp với Model HopDong.js
        this.MaVaiTroHD = safeParseInt(data.MaVaiTroHD || data.MaVaitroHD);
        
        this.MaNV = safeParseInt(data.MaNV);
        this.GiaTriCanHo = safeParseInt(data.GiaTriCanHo);
        this.GiaThoaThuan = safeParseInt(data.GiaThoaThuan);
        
        this.NgayLap = data.NgayLap || new Date();
        this.NgayXuLyDuKien = data.NgayXuLyDuKien || null;
        this.NgayHieuLuc = data.NgayHieuLuc || null;
        this.NgayHetHan = data.NgayHetHan || null;
        this.DiaChiKyHopDong = data.DiaChiKyHopDong?.trim() || null;
        this.SDTNhanLienLac = data.SDTNhanLienLac?.trim() || null;
        
        if (data.TrangThaiHD === 'null' || data.TrangThaiHD === undefined || data.TrangThaiHD === '') {
            this.TrangThaiHD = null;
        } else {
            this.TrangThaiHD = data.TrangThaiHD === 'true' || data.TrangThaiHD === true;
        }

        this.DSA_HopDongToDelete = data.DSA_HopDongToDelete;
    }

    validate() {
        if (!this.MaKH) return 'Vui lòng chọn khách hàng';
        if (!this.MaCanHo) return 'Vui lòng chọn căn hộ';
        if (!this.MaLoaiHD) return 'Vui lòng chọn loại hợp đồng';
        if (!this.MaVaiTroHD) return 'Vui lòng chọn vai trò';
        return null;
    }
}

module.exports = { DichVuDTO, LoaiTTHDDTO, HopDongDTO };