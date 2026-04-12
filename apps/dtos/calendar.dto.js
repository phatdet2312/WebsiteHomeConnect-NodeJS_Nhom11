class EventDTO {
    constructor(data) {
        this.MaLich = parseInt(data.MaLich);
        this.TieuDe = data.TieuDe?.trim();
        this.ThoiGianBatDau = data.ThoiGianBatDau;
        this.ThoiGIanKetThuc = data.ThoiGIanKetThuc;
        this.DiaDiem = data.DiaDiem?.trim();
        this.MoTa = data.MoTa?.trim();
    }

    validate() {
        if (!this.MaLich || isNaN(this.MaLich)) return 'Lịch không hợp lệ';
        if (!this.TieuDe) return 'Tiêu đề sự kiện không được để trống';
        if (!this.ThoiGianBatDau || !this.ThoiGIanKetThuc) return 'Thiếu thông tin thời gian';
        if (new Date(this.ThoiGianBatDau) > new Date(this.ThoiGIanKetThuc)) return 'Giờ kết thúc phải sau giờ bắt đầu';
        return null;
    }
}

class CalendarFilterDTO {
    constructor(query) {
        this.thang = parseInt(query.thang);
        this.nam = parseInt(query.nam);
        this.maLich = query.maLich ? parseInt(query.maLich) : null;
    }

    validate() {
        if (!this.thang || !this.nam) return 'Vui lòng cung cấp tháng và năm hợp lệ';
        return null;
    }
}

class LichDTO {
    constructor(data) {
        this.TenLich = data.TenLich?.trim();
        this.MauSac = data.MauSac?.trim();
        this.MoTa = data.MoTa?.trim();
    }

    validate() {
        if (!this.TenLich) return 'Tên lịch không được để trống';
        return null;
    }
}

module.exports = { EventDTO, CalendarFilterDTO, LichDTO };