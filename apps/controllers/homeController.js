const homeService = require('../services/homeService');
const { ContactDTO } = require('../dtos/public.dto');

class HomeController {
    // -- RENDER VIEWS --
    renderIndex(req, res) { res.render('home/index', { title: 'HomeConnect - Hệ thống quản lý căn hộ', layout: 'layouts/main' }); }
    renderLienHe(req, res) { res.render('home/lienHe', { title: 'Liên hệ - HomeConnect', layout: 'layouts/main', sent: false }); }
    renderDichVu(req, res) { res.render('home/dichVu', { title: 'Dịch vụ - HomeConnect', layout: 'layouts/main' }); }
    renderThanhToanHD(req, res) { res.render('home/thanhToanHopDong', { title: 'Hợp Đồng & Thanh Toán', layout: 'layouts/main' }); }
    renderBaoLoi(req, res) { res.render('errors/access-denied', { title: 'Không có quyền truy cập', layout: 'layouts/main' }); }
    renderPrivacy(req, res) { res.render('home/privacy', { title: 'Chính sách bảo mật', layout: 'layouts/main' }); }

    // -- FORM SUBMITS --
    async submitLienHe(req, res) {
        try {
            const dto = new ContactDTO(req.body);
            const error = dto.validate();
            if (error) return res.render('home/lienHe', { title: 'Liên hệ', layout: 'layouts/main', sent: false, error: error });
            
            await homeService.processContactForm(dto);
            res.render('home/lienHe', { title: 'Liên hệ - HomeConnect', layout: 'layouts/main', sent: true });
        } catch (err) {
            res.render('home/lienHe', { title: 'Liên hệ', layout: 'layouts/main', sent: false, error: err.message });
        }
    }

    // -- APIs --
    async apiGetHome(req, res) {
        try { const data = await homeService.getHomeDashboardData(); res.json(data); } 
        catch (err) { res.json({ banners: [], featuredCanHo: [], dichVus: [] }); }
    }

    async apiGetFeatured(req, res) {
        try { const list = await homeService.getFeaturedCanHo(); res.json(list); } 
        catch (err) { res.json([]); }
    }

    async apiGetBanners(req, res) {
        try { const list = await homeService.getBanners(); res.json(list); } 
        catch (err) { res.json([]); }
    }

    async apiGetSearchSuggestions(req, res) {
        try { const list = await homeService.getSearchSuggestions(req.query.q); res.json(list); } 
        catch (err) { res.json([]); }
    }

    async apiChatGemini(req, res) {
        try {
            const { message, context } = req.body;
            const reply = await homeService.askGeminiAI(message, context);
            res.json({ success: true, message: reply });
        } catch (err) {
            res.json({ success: false, message: 'Xin lỗi, AI hiện không khả dụng: ' + err.message });
        }
    }

    apiKeepAlive(req, res) { res.json({ alive: true }); }
}
module.exports = new HomeController();