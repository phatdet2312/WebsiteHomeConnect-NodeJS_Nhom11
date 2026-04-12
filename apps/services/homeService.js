const homeRepo = require('../repositories/homeRepository');
const canHoRepo = require('../repositories/canHoRepository');
const emailService = require('./emailService');
const geminiService = require('./geminiService');
const { SearchSuggestionDTO } = require('../dtos/public.dto');

class HomeService {
    async getHomeDashboardData() {
        const [banners, featuredCanHo, dichVus] = await Promise.all([
            homeRepo.getActiveBanners(10), // Lấy 10 banner
            canHoRepo.getFeaturedCanHo(6), // Lấy 6 căn hộ nổi bật cho trang chủ
            homeRepo.getActiveDichVus(6)   // Lấy 6 dịch vụ
        ]);
        return { banners, featuredCanHo, dichVus };
    }

    async getFeaturedCanHo() {
        return await canHoRepo.getFeaturedCanHo(8);
    }

    async getBanners() {
        return await homeRepo.getActiveBanners(10);
    }

    async getSearchSuggestions(keyword) {
        if (!keyword) return [];
        const results = await canHoRepo.searchSuggestions(keyword);
        return results.map(c => new SearchSuggestionDTO(c));
    }

    async processContactForm(dto) {
        await emailService.sendContactEmail({ 
            name: dto.HoTen, email: dto.Email, phone: dto.SDT, 
            subject: dto.TieuDe, message: dto.NoiDung 
        });
    }

    async askGeminiAI(message, context) {
        return await geminiService.chat(message, context);
    }
}
module.exports = new HomeService();