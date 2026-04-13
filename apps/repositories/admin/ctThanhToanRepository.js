const { LoaiTTHD, CT_ThanhToan, CanHo, Tang, ToaNha, KyTT, HD_HopDong, CT_HDHD, LS_TTHDHD, TrangThai, HopDong, KhachHang, PTTT } = require('../../models');

class CTThanhToanRepository {
    async getAllLoaiTT() { return await LoaiTTHD.findAll({ where: { TTHienThi: true }, order: [['TenLoaiTT', 'ASC']] }); }


    async getLatestStatusName(maHDHD) {
        const ls = await LS_TTHDHD.findOne({
            where: { MaHDHD: maHDHD },
            include: [{ model: TrangThai, as: 'TrangThai' }],
            order: [['ThoiGianThayDoi', 'DESC']]
        });
        return ls && ls.TrangThai ? ls.TrangThai.TenTT : null;
    }
    
    async getWorkspaceData(maLoaiTT) {
        return await CT_ThanhToan.findAll({
            where: { MaLoaiTT: maLoaiTT },
            include: [
                { model: CanHo, as: 'CanHoTT', attributes: ['MaCanHo', 'TenCanHo'], include: [{ model: Tang, as: 'Tang', attributes: ['TenTang'], include: [{ model: ToaNha, attributes: ['TenToaNha'] }] }] },
                { model: KyTT, attributes: ['MaKyTT', 'TenKyTT'] }
            ]
        });
    }

    async getLatestLS(maLoaiTT, maCanHo, maKyTT) {
        const hdList = await HD_HopDong.findAll({ include: [{ model: CT_HDHD, where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT }, required: true }] });
        if (!hdList.length) return null;
        const maHDHDList = hdList.map(h => h.MaHDHD);
        const lsList = await LS_TTHDHD.findAll({ where: { MaHDHD: maHDHDList }, include: [{ model: TrangThai, as: 'TrangThai' }], order: [['ThoiGianThayDoi', 'DESC']] });
        return lsList[0] || null;
    }

    async getHDById(maHDHD) { return await HD_HopDong.findByPk(maHDHD, { include: [{ model: PTTT, as: 'PTTT' }, { model: HopDong, as: 'HopDong', include: [{ model: KhachHang, as: 'KhachHang' }] }] }); }

    async getMetadata() {
        return await Promise.all([
            ToaNha.findAll({ order: [['TenToaNha', 'ASC']] }), Tang.findAll({ order: [['TenTang', 'ASC']] }),
            KyTT.findAll({ order: [['MaKyTT', 'ASC']] }), TrangThai.findAll({ order: [['TenTT', 'ASC']] })
        ]);
    }

    async getTangsByToaNha(maToaNha) { return await Tang.findAll({ where: { MaToaNha: maToaNha }, order: [['TenTang', 'ASC']] }); }
    async getCanHos(where) { return await CanHo.findAll({ where, include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha }] }], order: [['TenCanHo', 'ASC']] }); }

    async findCT(maLoaiTT, maCanHo, maKyTT) { return await CT_ThanhToan.findOne({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT } }); }
    async createCT(data) { return await CT_ThanhToan.create(data); }
    async deleteCT(maLoaiTT, maCanHo, maKyTT) { return await CT_ThanhToan.destroy({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT } }); }
    
    async countCTHDHD(maLoaiTT, maCanHo, maKyTT) { return await CT_HDHD.count({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT } }); }

    async createKy(data) { return await KyTT.create(data); }
    async updateKy(id, data) { return await KyTT.update(data, { where: { MaKyTT: id } }); }
    async deleteKy(id) { return await KyTT.destroy({ where: { MaKyTT: id } }); }
    async countKyUsage(id) { return await CT_ThanhToan.count({ where: { MaKyTT: id } }); }

    async getChiTietHoaDon(maLoaiTT, maCanHo, maKyTT) { return await CT_HDHD.findAll({ where: { MaLoaiTT: maLoaiTT, MaCanHo: maCanHo, MaKyTT: maKyTT } }); }
    async getHoaDonsByIds(ids) { return await HD_HopDong.findAll({ where: { MaHDHD: ids }, include: [{ model: PTTT, as: 'PTTT' }] }); }
    async getLichSuHoaDon(maHDHD) { return await LS_TTHDHD.findAll({ where: { MaHDHD: maHDHD }, include: [{ model: TrangThai, as: 'TrangThai' }], order: [['ThoiGianThayDoi', 'DESC']] }); }
    async createLS_TTHDHD(data) { return await LS_TTHDHD.create(data); }
}
module.exports = new CTThanhToanRepository();