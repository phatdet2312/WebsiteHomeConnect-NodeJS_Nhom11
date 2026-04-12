const repo = require('../../repositories/admin/dashboardRepository');

class DashboardService {
    async getDashboardData() {
        const stats = await repo.getGlobalStats();
        const recentHopDongRaw = await repo.getRecentHopDong();
        const recentCanHoRaw = await repo.getRecentCanHo();

        const recentHopDong = recentHopDongRaw.map(hd => ({
            MaHD: hd.MaHopDong,
            HoTen: hd.KhachHang ? hd.KhachHang.TenKH : `KH#${hd.MaKH}`,
            MaKH: hd.MaKH,
            TTHopDong: hd.TrangThaiHD
        }));

        const recentCanHo = recentCanHoRaw.map(c => ({
            MaCanHo: c.MaCanHo, TenCanHo: c.TenCanHo, GiaBan: c.Gia
        }));

        return { stats, recentHopDong, recentCanHo };
    }
}
module.exports = new DashboardService();