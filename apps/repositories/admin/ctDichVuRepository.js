const { DichVu, CT_DichVu, CanHo, Tang, ToaNha, Ky, HD_DichVu, CT_HDDV, LS_TTHDDV, TrangThai, KhachHang, PTTT } = require('../../models');

class CTDichVuRepository {
    async getAllDichVu() { return await DichVu.findAll({ where: { TTHienThi: true }, order: [['TenDV', 'ASC']] }); }
    
    // Lấy tên trạng thái mới nhất của một hóa đơn cụ thể
    async getLatestStatusName(maHDDV) {
        const ls = await LS_TTHDDV.findOne({
            where: { MaHDDV: maHDDV },
            include: [{ model: TrangThai, as: 'TrangThai' }],
            order: [['ThoiGianThayDoi', 'DESC']]
        });
        return ls && ls.TrangThai ? ls.TrangThai.TenTT : null;
    }

    async getWorkspaceData(maDV) {
        return await CT_DichVu.findAll({
            where: { MaDV: maDV },
            include: [
                { model: CanHo, as: 'CanHo', attributes: ['MaCanHo', 'TenCanHo'], include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }] },
                { model: Ky, as: 'Ky', attributes: ['MaKy', 'TenKy'] }
            ]
        });
    }

    async getLatestLS(maDV, maCanHo, maKy) {
        const hdList = await HD_DichVu.findAll({ include: [{ model: CT_HDDV, where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy }, required: true }] });
        if (!hdList.length) return null;
        const maHDDVList = hdList.map(h => h.MaHDDV);
        const lsList = await LS_TTHDDV.findAll({ where: { MaHDDV: maHDDVList }, include: [{ model: TrangThai, as: 'TrangThai' }], order: [['ThoiGianThayDoi', 'DESC']] });
        return lsList[0] || null;
    }

    async getHDById(maHDDV) { return await HD_DichVu.findByPk(maHDDV, { include: [{ model: PTTT, as: 'PTTT' }, { model: KhachHang }] }); }

    async getMetadata() {
        return await Promise.all([
            ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }), Tang.findAll({ order: [['TenTang', 'ASC']] }),
            Ky.findAll({ order: [['MaKy', 'ASC']] }), TrangThai.findAll({ order: [['TenTT', 'ASC']] })
        ]);
    }

    async getTangsByToaNha(maToaNha) { return await Tang.findAll({ where: { MaToaNha: maToaNha }, order: [['TenTang', 'ASC']] }); }
    async getCanHos(where) { return await CanHo.findAll({ where, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']] }); }

    async findCT(maDV, maCanHo, maKy) { return await CT_DichVu.findOne({ where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy } }); }
    async createCT(data) { return await CT_DichVu.create(data); }
    async deleteCT(maDV, maCanHo, maKy) { return await CT_DichVu.destroy({ where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy } }); }
    
    async countCTHDDV(maDV, maCanHo, maKy) { return await CT_HDDV.count({ where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy } }); }

    async createKy(data) { return await Ky.create(data); }
    async updateKy(id, data) { return await Ky.update(data, { where: { MaKy: id } }); }
    async deleteKy(id) { return await Ky.destroy({ where: { MaKy: id } }); }
    async countKyUsage(id) { return await CT_DichVu.count({ where: { MaKy: id } }); }

    async getChiTietHoaDon(maDV, maCanHo, maKy) { return await CT_HDDV.findAll({ where: { MaDV: maDV, MaCanHo: maCanHo, MaKy: maKy } }); }
    async getHoaDonsByIds(ids) { return await HD_DichVu.findAll({ where: { MaHDDV: ids }, include: [{ model: PTTT, as: 'PTTT' }] }); }
    async getLichSuHoaDon(maHDDV) { return await LS_TTHDDV.findAll({ where: { MaHDDV: maHDDV }, include: [{ model: TrangThai, as: 'TrangThai' }], order: [['ThoiGianThayDoi', 'DESC']] }); }
    async createLS_TTHDDV(data) { return await LS_TTHDDV.create(data); }
}
module.exports = new CTDichVuRepository();