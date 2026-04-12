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
        this.MaKH = parseInt(data.MaKH);
        this.MaCanHo = parseInt(data.MaCanHo);
        this.MaLoaiHD = parseInt(data.MaLoaiHD);
        this.MaVaiTroHD = parseInt(data.MaVaiTroHD);
        this.MaNV = data.MaNV ? parseInt(data.MaNV) : null;
        this.GiaTriCanHo = data.GiaTriCanHo ? parseInt(data.GiaTriCanHo) : null;
        this.GiaThoaThuan = data.GiaThoaThuan ? parseInt(data.GiaThoaThuan) : null;
        this.NgayLap = data.NgayLap || new Date();
        this.NgayXuLyDuKien = data.NgayXuLyDuKien || null;
        this.NgayHieuLuc = data.NgayHieuLuc || null;
        this.NgayHetHan = data.NgayHetHan || null;
        this.DiaChiKyHopDong = data.DiaChiKyHopDong?.trim() || null;
        this.SDTNhanLienLac = data.SDTNhanLienLac?.trim() || null;
        
        // Trạng thái HĐ có 3 mức: true, false, null
        if (data.TrangThaiHD === 'null' || data.TrangThaiHD === undefined) this.TrangThaiHD = null;
        else this.TrangThaiHD = data.TrangThaiHD === 'true' || data.TrangThaiHD === true;

        this.DSA_HopDongToDelete = data.DSA_HopDongToDelete;
    }
    validate() {
        if (isNaN(this.MaKH)) return 'Vui lòng chọn khách hàng';
        if (isNaN(this.MaCanHo)) return 'Vui lòng chọn căn hộ';
        return null;
    }
}

module.exports = { DichVuDTO, LoaiTTHDDTO, HopDongDTO };