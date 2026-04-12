const service = require('../../services/admin/ctThanhToanService');
const { GanKyHangLoatDTO, CapNhatInlineDTO, KyThaoTacDTO, TrangThaiHoaDonDTO } = require('../../dtos/admin/assignment.dto');

class CTThanhToanController {
    renderIndex(req, res) { res.render('admin/ctThanhToan/index', { title: 'Quản Lý Loại Thanh Toán Hợp Đồng', layout: 'layouts/admin' }); }
    
    async renderChiTiet(req, res) {
        try {
            // ĐÃ FIX: Chuyển service.repo.getAllLoaiTT() thành service.getAllServices()
            const allServices = await service.getAllServices();
            const loaiTT = allServices.find(x => x.MaLoaiTT == req.params.id);
            
            if (!loaiTT) return res.redirect('/admin/ct-thanh-toan');
            res.render('admin/ctThanhToan/chiTietThanhToan', { title: 'Workspace - ' + loaiTT.TenLoaiTT, layout: 'layouts/admin', loaiTT });
        } catch (err) { 
            console.error("Lỗi Render Chi tiết Hợp đồng:", err);
            res.redirect('/admin/ct-thanh-toan'); 
        }
    }

    async apiGetServices(req, res) { try { res.json({ success: true, data: await service.getAllServices() }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetWorkspaceData(req, res) { try { res.json({ success: true, data: await service.getWorkspaceData(parseInt(req.params.maLoaiTT)) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetMetadata(req, res) { try { res.json({ success: true, ...await service.getMetadata() }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetTangs(req, res) { try { res.json({ success: true, data: await service.getTangs(req.query.maToaNha) }); } catch (err) { res.json({ success: false, data: [] }); } }
    async apiGetCanHos(req, res) { try { res.json({ success: true, data: await service.getCanHos(req.query.maTang, req.query.maToaNha) }); } catch (err) { res.json({ success: false, data: [] }); } }
    
    async apiGanKyHangLoat(req, res) {
        try {
            const dto = new GanKyHangLoatDTO(req.body);
            const count = await service.processGanKyHangLoat(dto);
            res.json({ success: true, message: `Gán kỳ thành công cho ${count} căn hộ!` });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiCapNhatInline(req, res) {
        try { await service.processCapNhatInline(new CapNhatInlineDTO(req.body)); res.json({ success: true, message: 'Cập nhật thành công!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiXoaCT(req, res) {
        try { await service.processXoaCT(new CapNhatInlineDTO(req.body)); res.json({ success: true, message: 'Xóa gán kỳ thành công!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiKyThaoTac(req, res) {
        try { await service.processThaoTacKy(new KyThaoTacDTO(req.body)); res.json({ success: true, message: 'Thao tác kỳ thành công' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiChiTietThanhToan(req, res) {
        try { res.json({ success: true, ...await service.getChiTietThanhToan(parseInt(req.query.maLoaiTT), parseInt(req.query.maCanHo), parseInt(req.query.maKyTT)) }); } 
        catch (err) { res.json({ success: false, message: err.message }); }
    }

    async apiCapNhatTrangThai(req, res) {
        try { await service.processCapNhatTrangThaiHoaDon(new TrangThaiHoaDonDTO(req.body)); res.json({ success: true, message: 'Đã cập nhật trạng thái hóa đơn!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new CTThanhToanController();