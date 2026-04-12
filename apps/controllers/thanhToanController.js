const thanhToanService = require('../services/thanhToanService');
const { CheckoutDTO } = require('../dtos/cart.dto');

const getCart = (req) => { try { return req.cookies.cart ? JSON.parse(req.cookies.cart) : []; } catch(e) { return []; } };
const getPending = (req) => { try { return req.cookies.vnpayPending ? JSON.parse(req.cookies.vnpayPending) : null; } catch(e) { return null; } };

class ThanhToanController {
    renderIndex(req, res) { res.render('thanhToanMuaThue/index', { title: 'Thanh toán mua/thuê căn hộ', layout: 'layouts/main' }); }

    async apiGetItems(req, res) {
        try {
            const cartSession = getCart(req);
            const data = await thanhToanService.getCheckoutPageData(cartSession);
            res.json(data);
        } catch (err) { res.status(500).json({ error: err.message }); }
    }

    async apiCheckout(req, res) {
        try {
            const maKH = req.user.dataValues.KhachHang?.MaKH;
            if (!maKH) return res.json({ success: false, message: 'Lỗi định danh khách hàng' });

            const dto = new CheckoutDTO(req.body);
            const err = dto.validate();
            if (err) return res.json({ success: false, message: err });

            if (dto.paymentMethod === 'vnpay') {
                const { pendingData, url } = thanhToanService.generateVnPayData(req, maKH, dto);
                res.cookie('vnpayPending', JSON.stringify(pendingData), { httpOnly: true, maxAge: 15 * 60 * 1000 });
                return res.json({ success: true, redirect: url });
            }

            // Thanh toán trực tiếp
            await thanhToanService.processDirectCheckout(maKH, dto.items);
            res.clearCookie('cart');
            res.json({ success: true });

        } catch (err) { res.status(500).json({ success: false, error: err.message }); }
    }

    async vnPayCallback(req, res) {
        try {
            const pendingData = getPending(req);
            const result = await thanhToanService.processVnPayCallback(req.query, pendingData);

            if (result.success) {
                res.clearCookie('vnpayPending');
                res.clearCookie('cart');
                return res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: true, result: result.result });
            }
            res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, result: result.result });
        } catch (err) {
            res.render('thanhToanMuaThue/paymentResult', { title: 'Kết quả thanh toán', layout: 'layouts/main', success: false, error: err.message });
        }
    }
}

module.exports = new ThanhToanController();