class PTTTDTO {
    constructor(data) {
        this.TenPT = data.TenPT?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.TenPT) return 'Tên phương thức thanh toán không được để trống';
        return null;
    }
}

class TrangThaiDTO {
    constructor(data) {
        this.TenTT = data.TenTT?.trim();
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }
    validate() {
        if (!this.TenTT) return 'Tên trạng thái không được để trống';
        return null;
    }
}

module.exports = { PTTTDTO, TrangThaiDTO };