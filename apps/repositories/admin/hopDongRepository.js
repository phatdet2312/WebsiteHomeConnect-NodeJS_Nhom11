// apps/repositories/admin/hopDongRepository.js
const { HopDong, KhachHang, CanHo, Tang, ToaNha, LoaiHopDong, VaiTroHD, NhanVien, DSA_HopDong } = require('../../models');

const hopDongIncludes = [
    { model: KhachHang, as: 'KhachHang', attributes: ['MaKH', 'TenKH', 'EmailKH', 'DTKH'] },
    { model: CanHo, as: 'CanHo', attributes: ['MaCanHo', 'TenCanHo'], include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }] },
    { model: LoaiHopDong, as: 'LoaiHopDong', attributes: ['MaLoaiHD', 'TenLoai'] },
    // Đảm bảo lấy đúng cột MaVaitroHD
    { model: VaiTroHD, as: 'VaiTroHD', attributes: ['MaVaitroHD', 'TenVaiTro'] },
    { model: NhanVien, as: 'NhanVien', attributes: ['MaNV', 'TenNV'] }
];

class HopDongRepository {
    async getMasterData() {
        return await Promise.all([
            KhachHang.findAll({ order: [['TenKH', 'ASC']] }),
            CanHo.findAll({ where: { TTHienThi: true }, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']] }),
            LoaiHopDong.findAll({ order: [['TenLoai', 'ASC']] }),
            VaiTroHD.findAll({ order: [['TenVaiTro', 'ASC']] }), // Lấy toàn bộ cột từ bảng VaiTroHD
            NhanVien.findAll({ order: [['TenNV', 'ASC']] })
        ]);
    }
    
    async countInvoicesGenerated(maHopDong) {
        return await HD_HopDong.count({ where: { MaHopDong: maHopDong } });
    }
    async getAllWithIncludes() { return await HopDong.findAll({ include: hopDongIncludes }); }
    async getById(id) { return await HopDong.findByPk(id, { include: [...hopDongIncludes, { model: DSA_HopDong }] }); }
    async create(data) { return await HopDong.create(data); }
    async createDSA(data) { return await DSA_HopDong.create(data); }
    async getDSAById(id) { return await DSA_HopDong.findByPk(id); }
}
module.exports = new HopDongRepository();