class ContactDTO {
    constructor(data) {
        this.HoTen = data.HoTen?.trim();
        this.Email = data.Email?.trim();
        this.SDT = data.SDT?.trim();
        this.TieuDe = data.TieuDe?.trim();
        this.NoiDung = data.NoiDung?.trim();
    }

    validate() {
        if (!this.HoTen || !this.Email || !this.TieuDe || !this.NoiDung) 
            return 'Vui lòng nhập đầy đủ thông tin bắt buộc (Họ tên, Email, Tiêu đề, Nội dung).';
        return null;
    }
}

class KhamPhaFilterDTO {
    constructor(query) {
        this.search = query.search?.trim() || '';
        this.minGia = parseInt(query.minGia) || null;
        this.maxGia = parseInt(query.maxGia) || null;
        this.maToaNha = parseInt(query.maToaNha) || null;
        this.loai = query.loai?.trim() || '';
        this.page = parseInt(query.page) || 1;
        this.limit = 12;
        this.offset = (this.page - 1) * this.limit;
    }
}

// Output DTO: Lọc bớt dữ liệu thừa của DB Model trước khi trả về gợi ý tìm kiếm
class SearchSuggestionDTO {
    constructor(model) {
        this.id = model.MaCanHo;
        this.ten = model.TenCanHo;
        this.tang = model.Tang?.TenTang || '';
        this.toaNha = model.Tang?.ToaNha?.TenToaNha || '';
    }
}

module.exports = { ContactDTO, KhamPhaFilterDTO, SearchSuggestionDTO };