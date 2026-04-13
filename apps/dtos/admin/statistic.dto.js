class ThongKeFilterDTO {
    constructor(query) {
        this.tuNgay = query.tuNgay?.trim() || '';
        this.denNgay = query.denNgay?.trim() || '';
        this.loai = query.loai?.trim() || 'thang';
        this.page = parseInt(query.page) || 1;
        this.limit = 20;
        this.offset = (this.page - 1) * this.limit;
    }
}

module.exports = { ThongKeFilterDTO };