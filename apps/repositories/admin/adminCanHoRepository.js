const { CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT, TrangThai, PTTT, DSA_CanHo, Phong, DSA_Phong, HopDong, KhachHang, VaiTroHD, CT_HDDV, CT_HDHD } = require('../../models');

class AdminCanHoRepository {
    async getMetadata() {
        return await Promise.all([
            ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }),
            Tang.findAll({ include: [{ model: ToaNha, attributes: ['TenToaNha'] }], order: [['TenTang', 'ASC']] }),
            HienTrang.findAll({ order: [['TenHienTrang', 'ASC']] }),
            TTTTvaMucTT.findAll({ order: [['Ten', 'ASC']] })
        ]);
    }

    async getCanHos(where, tangInclude) {
        return await CanHo.findAll({
            where,
            include: [
                tangInclude,
                { model: HienTrang, as: 'HienTrang', attributes: ['TenHienTrang', 'MucDo'] },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT', attributes: ['Ten', 'MucDo'] },
                { model: Phong, as: 'Phongs', attributes: ['MaPhong'] },
                { model: HopDong, required: false, where: { TrangThaiHD: true }, include: [{ model: KhachHang, as: 'KhachHang', attributes: ['TenKH'] }, { model: VaiTroHD, as: 'VaiTroHD', attributes: ['TenVaiTro'] }] }
            ],
            order: [['MaCanHo', 'DESC']]
        });
    }

    async getSuggestionsQuery() {
        return await CanHo.findAll({ include: [{ model: Tang, as: 'Tang', include: [ToaNha] }] });
    }

    async getById(id) {
        return await CanHo.findByPk(id, {
            include: [
                { model: Tang, as: 'Tang', include: [{ model: ToaNha }] },
                { model: HienTrang, as: 'HienTrang' },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT' },
                { model: DSA_CanHo, as: 'DSA_CanHos' },
                { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
                { model: HopDong, required: false, where: { TrangThaiHD: true }, include: [{ model: KhachHang, as: 'KhachHang' }, { model: VaiTroHD, as: 'VaiTroHD' }] }
            ]
        });
    }

    async getTangsByToaNha(maToaNha) { return await Tang.findAll({ where: { MaToaNha: maToaNha }, order: [['TenTang', 'ASC']] }); }
    
    async getCanHoBasicList(where) { return await CanHo.findAll({ where, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']] }); }

    async createCanHo(data) { return await CanHo.create(data); }
    async createDSACanHo(data) { return await DSA_CanHo.create(data); }
    async createPhong(data) { return await Phong.create(data); }
    async createDSAPhong(data) { return await DSA_Phong.create(data); }
    
    async getDSA_CanHoById(id) { return await DSA_CanHo.findByPk(id); }
    async getPhongById(id) { return await Phong.findByPk(id, { include: [DSA_Phong] }); }
    async getDSA_PhongById(id) { return await DSA_Phong.findByPk(id); }
    
    async updateBulk(payload, ids) { return await CanHo.update(payload, { where: { MaCanHo: ids } }); }

    // ==========================================
    // ĐÃ THÊM: CÁC HÀM KIỂM TRA RÀNG BUỘC XÓA
    // ==========================================
    async countHopDongByCanHo(maCanHo) {
        return await HopDong.count({ where: { MaCanHo: maCanHo } });
    }

    async countHoaDonDichVuByCanHo(maCanHo) {
        return await CT_HDDV.count({ where: { MaCanHo: maCanHo } });
    }

    async countHoaDonHopDongByCanHo(maCanHo) {
        return await CT_HDHD.count({ where: { MaCanHo: maCanHo } });
    }
}
module.exports = new AdminCanHoRepository();