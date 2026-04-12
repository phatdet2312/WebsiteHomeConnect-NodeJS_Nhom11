const { ThongTinNguoiDung, KhachHang, NhanVien, VaiTroNhanVien } = require('../../models');

class QuanLyNguoiDungRepository {
    async getAllUsers() {
        return await ThongTinNguoiDung.findAll({
            include: [
                { model: KhachHang, required: false, attributes: ['MaKH', 'TenKH'] },
                { model: NhanVien, required: false, attributes: ['MaNV', 'TenNV'], include: [{ model: VaiTroNhanVien, attributes: ['MaVTNV', 'ChucVu'] }] }
            ],
            order: [['HoTen', 'ASC']]
        });
    }

    async getBaseUsers() { return await ThongTinNguoiDung.findAll(); }
    
    async getUserById(id) {
        return await ThongTinNguoiDung.findByPk(id, {
            include: [
                { model: KhachHang, required: false },
                { model: NhanVien, required: false, include: [{ model: VaiTroNhanVien }] }
            ]
        });
    }

    async getNhanVienByUserId(userId) { return await NhanVien.findOne({ where: { UserId: userId } }); }
    async createNhanVien(data) { return await NhanVien.create(data); }
    async deleteVaiTroByMaNV(maNV) { return await VaiTroNhanVien.destroy({ where: { MaNV: maNV } }); }
    async createVaiTro(data) { return await VaiTroNhanVien.create(data); }
}
module.exports = new QuanLyNguoiDungRepository();