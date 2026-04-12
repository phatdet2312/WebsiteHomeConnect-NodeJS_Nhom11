const service = require('../../services/admin/dashboardService');

class DashboardController {
    async renderDashboard(req, res) {
        try {
            const data = await service.getDashboardData();
            res.render('admin/dashboard', {
                title: 'Bảng điều khiển Admin', layout: 'layouts/admin',
                stats: data.stats, recentHopDong: data.recentHopDong, recentCanHo: data.recentCanHo
            });
        } catch (err) {
            console.error(err);
            res.render('admin/dashboard', {
                title: 'Dashboard', layout: 'layouts/admin',
                stats: { tongKH: 0, tongCanHo: 0, tongHD: 0, tongDV: 0, tongToaNha: 0, canHoTrong: 0, hdChoDuyet: 0, tongBanner: 0 },
                recentHopDong: [], recentCanHo: []
            });
        }
    }
}
module.exports = new DashboardController();