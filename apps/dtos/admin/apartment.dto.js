class CanHoDTO {
    constructor(data) {
        this.TenCanHo = data.TenCanHo?.trim();
        this.MaTang = parseInt(data.MaTang);
        this.MaHienTrang = data.MaHienTrang ? parseInt(data.MaHienTrang) : null;
        this.MaMucTT = data.MaMucTT ? parseInt(data.MaMucTT) : null;
        this.ViTriDay = parseInt(data.ViTriDay) || 1;
        this.ThuTu = parseInt(data.ThuTu) || 1;
        this.Gia = data.Gia ? parseInt(data.Gia) : null;
        this.GiaThue = data.GiaThue ? parseInt(data.GiaThue) : null;
        this.MoTa = data.MoTa?.trim() || null;
        this.Dai = data.Dai ? parseFloat(data.Dai) : null;
        this.Rong = data.Rong ? parseFloat(data.Rong) : null;
        this.Cao = data.Cao ? parseFloat(data.Cao) : null;
        this.TamNhin = data.TamNhin?.trim() || null;
        this.TTDeXuat = data.TTDeXuat === 'true';
        this.TTHienThi = data.TTHienThi === 'true';
        
        // Dữ liệu mảng (Phòng, Ảnh xóa)
        this.TenPhongList = data.TenPhongList;
        this.MaPhongList = data.MaPhongList;
        this.DSA_CanHoToDelete = data.DSA_CanHoToDelete;
        this.PhongToDelete = data.PhongToDelete;
        this.DSA_PhongToDelete = data.DSA_PhongToDelete;
    }
    validate() {
        if (!this.TenCanHo) return 'Tên căn hộ không được để trống';
        if (!this.MaTang || isNaN(this.MaTang)) return 'Vui lòng chọn Tầng';
        return null;
    }
}

class DanhMucNoiThatDTO {
    constructor(data) {
        this.TenDMNT = data.TenDMNT?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
        this.TTDeXuat = data.TTDeXuat === 'on' || data.TTDeXuat === 'true';
    }
    validate() {
        if (!this.TenDMNT) return 'Tên danh mục không được để trống';
        return null;
    }
}

class TTTTvaMucTTDTO {
    constructor(data) {
        this.Ten = data.Ten?.trim();
        this.MucDo = parseInt(data.MucDo);
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.Ten) return 'Tên không được để trống';
        if (isNaN(this.MucDo)) return 'Mức độ phải là số hợp lệ';
        return null;
    }
}

module.exports = { CanHoDTO, DanhMucNoiThatDTO, TTTTvaMucTTDTO };