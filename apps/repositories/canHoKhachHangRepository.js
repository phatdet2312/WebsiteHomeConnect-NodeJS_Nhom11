const { HopDong, CanHo, Tang, ToaNha, LoaiHopDong, NhanVien, DSA_CanHo, Phong, DSA_Phong, CT_NoiThat, NoiThat, DanhMucNoiThat, HienTrang, CT_DichVu, DichVu, VaiTroHD, KhachHang } = require('../models');

class CanHoKhachHangRepository {
    async getMyContracts(maKH) {
        return await HopDong.findAll({
            where: { MaKH: maKH },
            include: [
                { model: CanHo, as: 'CanHo', include: [
                    { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
                    { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
                ]},
                { model: LoaiHopDong, as: 'LoaiHopDong' }
            ],
            order: [['MaHopDong', 'DESC']]
        });
    }

    async getContractDetail(maHopDong, maKH) {
        return await HopDong.findOne({
            where: { MaHopDong: maHopDong, MaKH: maKH },
            include: [
                { model: CanHo, as: 'CanHo', include: [
                    { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
                    { model: DSA_CanHo, as: 'DSA_CanHos' },
                    { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
                    { model: HienTrang, as: 'HienTrang' },
                    { model: CT_NoiThat, as: 'CT_NoiThats', include: [
                        { model: NoiThat, as: 'NoiThat', include: [{ model: DanhMucNoiThat, as: 'DanhMucNoiThat' }] },
                        { model: HienTrang, as: 'HienTrangCT' }
                    ]},
                    { model: CT_DichVu, as: 'CT_DichVus', include: [{ model: DichVu, as: 'DichVu' }] }
                ]},
                { model: LoaiHopDong, as: 'LoaiHopDong' },
                { model: NhanVien, as: 'NhanVien' },
                { model: VaiTroHD, as: 'VaiTroHD' },
                { model: KhachHang, as: 'KhachHang' }
            ]
        });
    }
}
module.exports = new CanHoKhachHangRepository();