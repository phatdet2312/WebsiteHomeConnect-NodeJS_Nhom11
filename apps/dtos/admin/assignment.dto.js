class GanKyHangLoatDTO {
    constructor(data) {
        this.maDV = data.maDV ? parseInt(data.maDV) : null;
        this.maLoaiTT = data.maLoaiTT ? parseInt(data.maLoaiTT) : null;
        this.maKy = data.maKy ? parseInt(data.maKy) : null;
        this.maKyTT = data.maKyTT ? parseInt(data.maKyTT) : null;

        // Đảm bảo luôn là mảng để xử lý hàng loạt
        this.dsCanHo = Array.isArray(data.danhSachCanHo) ? data.danhSachCanHo : (data.danhSachCanHo ? [data.danhSachCanHo] : []);
        this.dsGia = Array.isArray(data.giaList) ? data.giaList : (data.giaList ? [data.giaList] : []);
        this.dsHan = Array.isArray(data.ngayDenHanList) ? data.ngayDenHanList : (data.ngayDenHanList ? [data.ngayDenHanList] : []);
        this.dsGhiChu = Array.isArray(data.ghiChuList) ? data.ghiChuList : (data.ghiChuList ? [data.ghiChuList] : []);
        this.dsMaAnh = Array.isArray(data.maCanHoAnh) ? data.maCanHoAnh : (data.maCanHoAnh ? [data.maCanHoAnh] : []);
        this.dsMaAnh = this.dsMaAnh.map(Number);
    }
    validate() {
        if (!this.dsCanHo.length) return 'Chưa chọn căn hộ nào để gán';
        return null;
    }
}

class CapNhatInlineDTO {
    constructor(data) {
        this.maCanHo = parseInt(data.maCanHo);
        this.maDV = data.maDV ? parseInt(data.maDV) : null;
        this.maLoaiTT = data.maLoaiTT ? parseInt(data.maLoaiTT) : null;
        this.maKy = data.maKy ? parseInt(data.maKy) : null;
        this.maKyTT = data.maKyTT ? parseInt(data.maKyTT) : null;
        this.gia = parseInt(data.gia) || 0;
        this.ngayDenHan = data.ngayDenHan || null;
        this.ghiChu = data.ghiChu || null;
    }
}

class KyThaoTacDTO {
    constructor(data) {
        this.action = data.action; // 'add', 'edit', 'delete'
        this.maKy = data.maKy ? parseInt(data.maKy) : null;
        this.maKyTT = data.maKyTT ? parseInt(data.maKyTT) : null;
        this.tenKy = data.tenKy?.trim();
        this.tenKyTT = data.tenKyTT?.trim();
    }
}

class TrangThaiHoaDonDTO {
    constructor(data) {
        this.maHD = parseInt(data.maHDDV || data.maHDHD);
        this.maTT = parseInt(data.maTT);
        this.ghiChu = data.ghiChu?.trim() || 'Cập nhật từ Workspace';
    }
}

module.exports = { GanKyHangLoatDTO, CapNhatInlineDTO, KyThaoTacDTO, TrangThaiHoaDonDTO };