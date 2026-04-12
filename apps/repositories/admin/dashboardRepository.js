const { KhachHang, CanHo, HopDong, DichVu, ToaNha, BannerQuangCao } = require('../../models');

class DashboardRepository {
    async getGlobalStats() {
        const [tongKH, tongCanHo, tongHD, tongDV, tongToaNha, canHoTrong, hdChoDuyet, tongBanner] = await Promise.all([
            KhachHang.count(),
            CanHo.count({ where: { TTHienThi: true } }),
            HopDong.count({ where: { TrangThaiHD: true } }),
            DichVu.count({ where: { TTHienThi: true } }),
            ToaNha.count(),
            CanHo.count({ where: { TTHienThi: true, TTDeXuat: false } }),
            HopDong.count({ where: { TrangThaiHD: null } }),
            BannerQuangCao.count({ where: { TTHienThi: true } })
        ]);
        return { tongKH, tongCanHo, tongHD, tongDV, tongToaNha, canHoTrong, hdChoDuyet, tongBanner };
    }

    async getRecentHopDong() {
        return await HopDong.findAll({
            limit: 5, order: [['MaHopDong', 'DESC']],
            include: [{ model: KhachHang, as: 'KhachHang', attributes: ['TenKH'] }]
        });
    }

    async getRecentCanHo() {
        return await CanHo.findAll({ limit: 5, order: [['MaCanHo', 'DESC']], attributes: ['MaCanHo', 'TenCanHo', 'Gia'] });
    }
}
module.exports = new DashboardRepository();