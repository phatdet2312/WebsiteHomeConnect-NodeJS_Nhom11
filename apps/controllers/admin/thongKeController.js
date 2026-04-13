const service = require('../../services/admin/thongKeService');
const { ThongKeFilterDTO } = require('../../dtos/admin/statistic.dto');

class ThongKeController {
    // --- 1. RENDER VIEWS (Chỉ trả về khung HTML rỗng) ---
    renderDashboard(req, res) { res.render('admin/thongKe/index', { title: 'Thống kê tổng quan', layout: 'layouts/admin' }); }
    renderDoanhThu(req, res) { res.render('admin/thongKe/doanhThu', { title: 'Báo cáo Doanh thu', layout: 'layouts/admin' }); }
    renderHopDong(req, res) { res.render('admin/thongKe/hopDong', { title: 'Thống kê Hợp đồng', layout: 'layouts/admin' }); }
    renderCanHo(req, res) { res.render('admin/thongKe/canHo', { title: 'Thống kê Căn hộ', layout: 'layouts/admin' }); }

    // --- 2. APIs (Chỉ trả về JSON) ---
    async apiGetDashboard(req, res) {
        try {
            const data = await service.getTongQuanDashboard();
            res.json({ success: true, data });
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async apiGetDoanhThu(req, res) {
        try {
            const dto = new ThongKeFilterDTO(req.query);
            const data = await service.getBaoCaoDoanhThu(dto);
            res.json({ success: true, data });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async apiGetHopDong(req, res) {
        try {
            const thongKeHD = await service.getThongKeHopDong();
            res.json({ success: true, data: thongKeHD });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async apiGetCanHo(req, res) {
        try {
            const thongKeCanHo = await service.getThongKeCanHo();
            res.json({ success: true, data: thongKeCanHo });
        } catch (err) {
            res.status(500).json({ success: false, message: err.message });
        }
    }
}

module.exports = new ThongKeController();