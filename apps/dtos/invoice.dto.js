class CheckoutDTO {
    constructor(data) {
        this.maPT = parseInt(data.maPT || data.MaPT);
        this.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
        this.paymentMethod = data.paymentMethod?.trim();
    }

    validate() {
        if (!this.maPT || isNaN(this.maPT)) return 'Vui lòng chọn phương thức thanh toán';
        if (!this.items || !this.items.length) return 'Vui lòng chọn ít nhất 1 khoản thanh toán';
        return null;
    }
}

module.exports = { CheckoutDTO };