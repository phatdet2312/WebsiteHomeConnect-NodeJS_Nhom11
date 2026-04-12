const cartService = require('../services/cartService');
const { CartItemDTO } = require('../dtos/cart.dto');

// Hàm hỗ trợ Cookie
const getCartFromCookie = (req) => { try { return req.cookies.cart ? JSON.parse(req.cookies.cart) : []; } catch(e) { return []; } };
const saveCartToCookie = (res, cart) => { res.cookie('cart', JSON.stringify(cart), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true }); };

class CartController {
    renderIndex(req, res) { res.render('shoppingCart/index', { title: 'Giỏ hàng - HomeConnect', layout: 'layouts/main' }); }
    renderOrderCompleted(req, res) { res.render('shoppingCart/orderCompleted', { title: 'Đặt hàng thành công', layout: 'layouts/main' }); }

    async apiGetList(req, res) {
        try {
            const cartSession = getCartFromCookie(req);
            const data = await cartService.getFullCartDetails(cartSession);
            res.json(data);
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    async apiAdd(req, res) {
        try {
            const dto = new CartItemDTO(req.body);
            const err = dto.validate();
            if (err) return res.json({ success: false, message: err });

            let cart = getCartFromCookie(req);
            cart = await cartService.addItemToCart(cart, dto);
            
            saveCartToCookie(res, cart);
            res.json({ success: true, count: cart.length });
        } catch (err) { res.json({ success: false, message: err.message }); }
    }

    apiRemove(req, res) {
        const dto = new CartItemDTO(req.body);
        let cart = getCartFromCookie(req);
        cart = cartService.removeItemFromCart(cart, dto);
        saveCartToCookie(res, cart);
        res.json({ success: true, count: cart.length });
    }

    apiRemoveSelected(req, res) {
        let cart = getCartFromCookie(req);
        cart = cartService.removeSelectedItems(cart, req.body.items);
        saveCartToCookie(res, cart);
        res.json({ success: true, count: cart.length });
    }
}

module.exports = new CartController();