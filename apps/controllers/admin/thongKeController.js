const service = require('../../services/admin/thongKeService');
const { ThongKeFilterDTO } = require('../../dtos/admin/statistic.dto');

class ThongKeController {
    async renderDashboard(req, res) {
        try {
            const data = await service.getTongQuanDashboard();
            res.render('admin/thongKe/index', {
                title: 'Thống kê', layout: 'layouts/admin',
                stats: data.stats,
                doanhThuTheoThang: data.doanhThuTheoThang,
                topCanHo: data.topCanHo,
                doanhThuToaNha: data.doanhThuToaNha,
                tyLeCanHo: data.tyLeCanHo,
                khachHangMoi: data.khachHangMoi,
                thuNhapDichVu: data.thuNhapDichVu,
                tuNgay: req.query.tuNgay || '', denNgay: req.query.denNgay || '', loai: req.query.loai || 'thang'
            });
        } catch (err) {
            console.error(err);
            req.flash('error_msg', err.message);
            res.redirect('/admin/dashboard');
        }
    }

    async renderDoanhThu(req, res) {
        try {
            const dto = new ThongKeFilterDTO(req.query);
            const data = await service.getBaoCaoDoanhThu(dto);
            
            res.render('admin/thongKe/doanhThu', {
                title: 'Báo cáo Doanh thu', layout: 'layouts/admin',
                items: data.items,
                total: data.total,
                tongTien: data.tongTien,
                tuNgay: dto.tuNgay, denNgay: dto.denNgay,
                currentPage: dto.page, totalPages: data.totalPages
            });
        } catch (err) {
            req.flash('error_msg', err.message);
            res.redirect('/admin/thong-ke');
        }
    }

    async renderHopDong(req, res) {
        try {
            const thongKeHD = await service.getThongKeHopDong();
            res.render('admin/thongKe/hopDong', { title: 'Thống kê Hợp đồng', layout: 'layouts/admin', thongKeHD });
        } catch (err) {
            req.flash('error_msg', err.message);
            res.redirect('/admin/thong-ke');
        }
    }

    async renderCanHo(req, res) {
        try {
            const thongKeCanHo = await service.getThongKeCanHo();
            res.render('admin/thongKe/canHo', { title: 'Thống kê Căn hộ', layout: 'layouts/admin', thongKeCanHo });
        } catch (err) {
            req.flash('error_msg', err.message);
            res.redirect('/admin/thong-ke');
        }
    }
}

module.exports = new ThongKeController();