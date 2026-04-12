class ToaNhaDTO {
    constructor(data) {
        this.TenToaNha = data.TenToaNha?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
        this.TTDeXuat = data.TTDeXuat === 'on' || data.TTDeXuat === 'true';
    }
    validate() {
        if (!this.TenToaNha) return 'Tên tòa nhà không được để trống';
        return null;
    }
}

class TangDTO {
    constructor(data) {
        this.TenTang = data.TenTang?.trim();
        this.SoHanhLang = parseInt(data.SoHanhLang) || 0;
        this.MaToaNha = parseInt(data.MaToaNha);
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
        this.TTDeXuat = data.TTDeXuat === 'on' || data.TTDeXuat === 'true';
    }
    validate() {
        if (!this.TenTang) return 'Tên tầng không được để trống';
        if (!this.MaToaNha || isNaN(this.MaToaNha)) return 'Vui lòng chọn Tòa nhà';
        return null;
    }
}

class HienTrangDTO {
    constructor(data) {
        this.TenHienTrang = data.TenHienTrang?.trim();
        this.MucDo = data.MucDo ? parseInt(data.MucDo) : null;
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.TenHienTrang) return 'Tên hiện trạng không được để trống';
        return null;
    }
}

module.exports = { ToaNhaDTO, TangDTO, HienTrangDTO };