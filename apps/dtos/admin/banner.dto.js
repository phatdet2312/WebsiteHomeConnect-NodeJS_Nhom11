class BannerDTO {
    constructor(data) {
        this.MoTa = data.MoTa?.trim();
        this.GhiChu = data.GhiChu?.trim() || null;
        this.UrlDichDen = data.UrlDichDen?.trim() || '#';
        this.TTHienThi = data.TTHienThi === 'on' || data.TTHienThi === 'true';
    }

    validate() {
        if (!this.MoTa) return 'Mô tả banner không được để trống';
        return null;
    }
}

module.exports = { BannerDTO };