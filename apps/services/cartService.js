const repo = require('../repositories/thanhToanRepository');

class CartService {
    async getFullCartDetails(cartSession) {
        if (!cartSession || cartSession.length === 0) return [];
        
        const maCanHoList = [...new Set(cartSession.map(i => i.maCanHo || i.MaCanHo))];
        const canHos = await repo.getCanHoDetailsInCart(maCanHoList);

        return cartSession.map(item => {
            const maCanHo = item.maCanHo || item.MaCanHo;
            const ch = canHos.find(c => c.MaCanHo == maCanHo);
            if (!ch) return null;
            
            return {
                MaCanHo: ch.MaCanHo, TenCanHo: ch.TenCanHo,
                UrlAnh: ch.DSA_CanHos && ch.DSA_CanHos.length > 0 ? ch.DSA_CanHos[0].UrlAnh : null,
                Gia: item.loai === 'mua' ? ch.Gia : ch.GiaThue,
                ToaNha: ch.Tang && ch.Tang.ToaNha ? ch.Tang.ToaNha.TenToaNha : '',
                Tang: ch.Tang ? ch.Tang.TenTang : '',
                loai: item.loai
            };
        }).filter(Boolean);
    }

    async addItemToCart(currentCart, dto) {
        const canHo = await repo.getCanHoById(dto.maCanHo);
        if (!canHo) throw new Error('Căn hộ không tồn tại hoặc đã bị ẩn');

        const exists = currentCart.find(i => (i.MaCanHo === dto.maCanHo || i.maCanHo === dto.maCanHo) && i.loai === dto.loai);
        if (!exists) {
            currentCart.push({
                MaCanHo: canHo.MaCanHo, TenCanHo: canHo.TenCanHo,
                Gia: dto.loai === 'mua' ? canHo.Gia : canHo.GiaThue,
                UrlAnh: canHo.UrlAnh, loai: dto.loai,
                Tang: canHo.Tang?.TenTang, ToaNha: canHo.Tang?.ToaNha?.TenToaNha
            });
        }
        return currentCart;
    }

    removeItemFromCart(currentCart, dto) {
        return currentCart.filter(i => !((i.MaCanHo === dto.maCanHo || i.maCanHo === dto.maCanHo) && i.loai === dto.loai));
    }

    removeSelectedItems(currentCart, itemsToRemove) {
        if (!itemsToRemove || !itemsToRemove.length) return currentCart;
        return currentCart.filter(c => !itemsToRemove.some(i => (i.maCanHo == c.MaCanHo || i.MaCanHo == c.MaCanHo) && i.loai === c.loai));
    }
}

module.exports = new CartService();