const repo = require('../repositories/thanhToanRepository');
const cartService = require('./cartService');
const vnpayService = require('./vnpayService'); 

class ThanhToanService {
    async getCheckoutPageData(cartSession) {
        const cart = await cartService.getFullCartDetails(cartSession);
        const pttts = await repo.getAllPTTT();
        return { cart, pttts };
    }

    async processDirectCheckout(maKH, items) {
        for (const item of items) {
            const canHo = await repo.getCanHoById(item.MaCanHo || item.maCanHo);
            if (!canHo) continue;
            
            await repo.createHopDong({
                MaKH: maKH, MaCanHo: canHo.MaCanHo, MaLoaiHD: item.loai === 'mua' ? 1 : 2,
                MaVaiTroHD: 1, GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
                GiaThoaThuan: item.Gia, NgayLap: new Date(), TrangThaiHD: null
            });
        }
    }

    generateVnPayData(req, maKH, dto) {
        const total = dto.items.reduce((sum, i) => sum + (i.Gia || 0), 0);
        const txnRef = 'MUA' + Date.now();
        const pendingData = { type: 'muaThue', maKH, MaPT: dto.MaPT, items: dto.items, txnRef };
        
        const url = vnpayService.createPaymentUrl(req, {
            amount: total, orderInfo: 'Thanh toan can ho HomeConnect',
            txnRef, returnUrl: process.env.BASE_URL + '/thanh-toan-mua-thue/callback-vnpay'
        });
        
        return { pendingData, url };
    }

    async processVnPayCallback(query, pendingData) {
        const result = vnpayService.verifyCallback(query);
        
        if (result.isValid && result.responseCode === '00' && pendingData && pendingData.type === 'muaThue') {
            for (const item of (pendingData.items || [])) {
                const canHo = await repo.getCanHoById(item.MaCanHo || item.maCanHo);
                if (!canHo) continue;
                
                await repo.createHopDong({
                    MaKH: pendingData.maKH, MaCanHo: canHo.MaCanHo, MaLoaiHD: item.loai === 'mua' ? 1 : 2,
                    MaVaiTroHD: 1, GiaTriCanHo: item.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
                    GiaThoaThuan: item.Gia, NgayLap: new Date(), TrangThaiHD: null
                });
            }
            return { success: true, result };
        }
        return { success: false, result };
    }
}

module.exports = new ThanhToanService();