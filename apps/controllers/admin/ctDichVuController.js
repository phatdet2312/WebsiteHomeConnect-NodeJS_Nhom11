const service = require('../../services/admin/ctDichVuService');
const { GanKyHangLoatDTO, CapNhatInlineDTO, KyThaoTacDTO, TrangThaiHoaDonDTO } = require('../../dtos/admin/assignment.dto');

class CTDichVuController {
    renderIndex(req, res) { res.render('admin/ctDichVu/index', { title: 'Quản Lý Gán Dịch Vụ', layout: 'layouts/admin' }); }
    
    async renderChiTiet(req, res) {
        try {
            // ĐÃ FIX: Chuyển service.repo.getAllDichVu() thành service.getAllServices()
            const allServices = await service.getAllServices();
            const dichVu = allServices.find(x => x.MaDV == req.params.id);
            
            if (!dichVu) return res.redirect('/admin/ct-dich-vu');
            res.render('admin/ctDichVu/chiTietDichVu', { title: 'Chi Tiết Dịch Vụ - ' + dichVu.TenDV, layout: 'layouts/admin', dichVu });
        } catch (err) { 
            console.error("Lỗi Render Chi tiết Dịch vụ:", err);
            res.redirect('/admin/ct-dich-vu'); 
        }
    }

    async apiGetServices(req, res) { try { res.json({ success: true, data: await service.getAllServices() }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetWorkspaceData(req, res) { try { res.json({ success: true, data: await service.getWorkspaceData(parseInt(req.params.maDV)) }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetMetadata(req, res) { try { res.json({ success: true, ...await service.getMetadata() }); } catch (err) { res.status(500).json({ success: false, message: err.message }); } }
    async apiGetTangs(req, res) { try { res.json({ success: true, data: await service.getTangs(req.query.maToaNha) }); } catch (err) { res.json({ success: false, data: [] }); } }
    async apiGetCanHos(req, res) { try { res.json({ success: true, data: await service.getCanHos(req.query.maTang, req.query.maToaNha) }); } catch (err) { res.json({ success: false, data: [] }); } }
    
    async apiGanKyHangLoat(req, res) {
        try {
            const dto = new GanKyHangLoatDTO(req.body);
            const count = await service.processGanKyHangLoat(dto, req.files || []);
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
        try { res.json({ success: true, ...await service.getChiTietThanhToan(parseInt(req.query.maDV), parseInt(req.query.maCanHo), parseInt(req.query.maKy)) }); } 
        catch (err) { res.json({ success: false, message: err.message }); }
    }

    async apiCapNhatTrangThai(req, res) {
        try { await service.processCapNhatTrangThaiHoaDon(new TrangThaiHoaDonDTO(req.body)); res.json({ success: true, message: 'Đã cập nhật trạng thái hóa đơn!' }); } 
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}
module.exports = new CTDichVuController();