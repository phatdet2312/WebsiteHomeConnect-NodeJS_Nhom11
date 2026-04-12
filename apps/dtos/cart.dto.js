class CartItemDTO {
    constructor(data) {
        // Tương thích ngược với cả camelCase và PascalCase từ Frontend
        this.maCanHo = parseInt(data.maCanHo || data.MaCanHo);
        this.loai = data.loai?.trim();
    }

    validate() {
        if (!this.maCanHo || isNaN(this.maCanHo)) return 'Mã căn hộ không hợp lệ';
        if (!['mua', 'thue'].includes(this.loai)) return 'Loại hình giao dịch không hợp lệ';
        return null;
    }
}

class CheckoutDTO {
    constructor(data) {
        this.MaPT = parseInt(data.MaPT || data.maPT);
        // Frontend có thể gửi chuỗi JSON hoặc Array trực tiếp
        this.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        this.paymentMethod = data.paymentMethod?.trim();
    }

    validate() {
        if (!this.MaPT || isNaN(this.MaPT)) return 'Vui lòng chọn phương thức thanh toán';
        if (!this.items || !this.items.length) return 'Vui lòng chọn ít nhất 1 căn hộ để thanh toán';
        return null;
    }
}

module.exports = { CartItemDTO, CheckoutDTO };