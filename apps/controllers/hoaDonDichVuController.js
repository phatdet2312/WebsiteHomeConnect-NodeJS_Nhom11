const service = require('../services/hoaDonDichVuService');
const { CheckoutDTO } = require('../dtos/invoice.dto');

class HoaDonDichVuController {
    renderIndex(req, res) { res.render('hoaDonDichVu/index', { title: 'Lịch sử Hóa đơn', layout: 'layouts/main' }); }
    renderThanhToan(req, res) { res.render('hoaDonDichVu/thanhToan', { title: 'Thanh toán', layout: 'layouts/main' }); }

    async apiGetDanhSach(req, res) {
        try { res.json({ success: true, data: await service.getDanhSachDVNo(req.user.dataValues.KhachHang?.MaKH) }); }
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiGetUnpaid(req, res) {
        try {
            const data = await service.getUnpaidItems(req.user.dataValues.KhachHang?.MaKH, parseInt(req.query.maDV));
            res.json({ success: true, ...data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiGetHistory(req, res) {
        try { res.json({ success: true, data: await service.getHistory(req.user.dataValues.KhachHang?.MaKH) }); }
        catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiCheckout(req, res) {
        try {
            const dto = new CheckoutDTO(req.body);
            const err = dto.validate();
            if (err) return res.json({ success: false, message: err });

            const result = await service.processCheckout(req, req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, ...result });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiHeartbeat(req, res) {
        try { await service.processHeartbeat(parseInt(req.body.maHoaDon)); res.json({ success: true }); }
        catch (err) { res.status(500).json({ success: false }); }
    }

    async vnpayCallback(req, res) {
        try {
            const data = await service.processVnpayReturn(req.query);
            res.render('hoaDonDichVu/paymentResult', { title: 'Kết quả', layout: 'layouts/main', success: data.success, result: data.result });
        } catch (err) { res.render('hoaDonDichVu/paymentResult', { title: 'Kết quả', layout: 'layouts/main', success: false, error: err.message }); }
    }
}
module.exports = new HoaDonDichVuController();