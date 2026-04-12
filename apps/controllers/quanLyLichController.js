const service = require('../services/quanLyLichService');
const { EventDTO, CalendarFilterDTO, LichDTO } = require('../dtos/calendar.dto');

class QuanLyLichController {
    renderIndex(req, res) {
        res.render('quanLyLich/index', { title: 'Quản lý lịch', layout: 'layouts/main' });
    }

    // --- LỊCH ---
    async apiGetLichs(req, res) {
        try {
            const data = await service.getLichs(req.user.dataValues.KhachHang?.MaKH);
            res.json({ success: true, data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiCreateLich(req, res) {
        try {
            const dto = new LichDTO(req.body);
            const data = await service.createLich(req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, message: 'Thêm lịch thành công', data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiUpdateLich(req, res) {
        try {
            const dto = new LichDTO(req.body);
            const data = await service.updateLich(req.params.id, req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, message: 'Cập nhật thành công', data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiDeleteLich(req, res) {
        try {
            await service.deleteLich(req.params.id, req.user.dataValues.KhachHang?.MaKH);
            res.json({ success: true, message: 'Đã xóa lịch' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    // --- SỰ KIỆN ---
    async apiGetEvents(req, res) {
        try {
            const dto = new CalendarFilterDTO(req.query);
            const events = await service.getAggregatedEvents(req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, data: events });
        } catch (err) {
            console.error("Lỗi API /su-kien:", err);
            res.status(500).json({ success: false, message: err.message });
        }
    }

    async apiCreateEvent(req, res) {
        try {
            const dto = new EventDTO(req.body);
            const data = await service.createEvent(req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, message: 'Đã thêm', data });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiUpdateEvent(req, res) {
        try {
            const dto = new EventDTO(req.body);
            await service.updateEvent(req.params.id, req.user.dataValues.KhachHang?.MaKH, dto);
            res.json({ success: true, message: 'Đã cập nhật' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }

    async apiDeleteEvent(req, res) {
        try {
            await service.deleteEvent(req.params.id, req.user.dataValues.KhachHang?.MaKH);
            res.json({ success: true, message: 'Đã xóa' });
        } catch (err) { res.status(500).json({ success: false, message: err.message }); }
    }
}

module.exports = new QuanLyLichController();