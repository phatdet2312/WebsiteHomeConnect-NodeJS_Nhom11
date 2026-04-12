const passport = require('passport');
const authService = require('../services/authService');
const authRepo = require('../repositories/authRepository');
const { RegisterSendCodeDTO, ChangePasswordDTO } = require('../dtos/auth.dto');

class AuthController {
    // Render Views
    renderLogin(req, res) {
        if (req.isAuthenticated()) return res.redirect('/');
        res.render('auth/login', { title: 'Đăng nhập - HomeConnect', layout: 'layouts/main' });
    }

    renderRegister(req, res) {
        if (req.isAuthenticated()) return res.redirect('/');
        res.render('auth/register', { title: 'Đăng ký - HomeConnect', layout: 'layouts/main' });
    }

    renderChangePassword(req, res) {
        if (!req.isAuthenticated()) return res.redirect('/auth/login');
        res.render('auth/changePassword', { title: 'Đổi mật khẩu', layout: 'layouts/main' });
    }

    // Auth APIs
    apiLogin(req, res, next) {
        passport.authenticate('local', { session: false }, async (err, user, info) => {
            if (err) return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
            if (!user) return res.status(401).json({ success: false, message: info ? info.message : 'Đăng nhập thất bại' });

            const token = authService.generateAuthToken(user.Id);
            res.cookie('auth_token', token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const redirectUrl = await authService.getRedirectUrlForUser(user);
            return res.json({ success: true, message: 'Đăng nhập thành công', redirectUrl });
        })(req, res, next);
    }

    googleCallback(req, res, next) {
        passport.authenticate('google', { session: false, failureRedirect: '/auth/login', failureFlash: true }, async (err, user, info) => {
            if (err) return next(err);
            if (!user) {
                req.flash('error_msg', 'Đăng nhập Google thất bại');
                return res.redirect('/auth/login');
            }

            const token = authService.generateAuthToken(user.Id);
            res.cookie('auth_token', token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const redirectUrl = await authService.getRedirectUrlForUser(user);
            res.redirect(redirectUrl);
        })(req, res, next);
    }

    async apiLogout(req, res) {
        if (req.user) {
            try {
                await authRepo.updateOfflineStatus(req.user.Id);
            } catch (e) { console.error("Lỗi cập nhật offline:", e); }
        }
        res.clearCookie('auth_token');
        req.user = null;
        req.flash('success_msg', 'Đã đăng xuất thành công');
        res.redirect('/auth/login');
    }

    async apiSendRegisterCode(req, res) {
        try {
            const dto = new RegisterSendCodeDTO(req.body);
            const result = await authService.processSendRegisterCode(dto);

            if (result.success) {
                res.cookie('register_token', result.tempToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
            }
            return res.json({ success: result.success, message: result.message });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
        }
    }

    async apiVerifyRegisterCode(req, res) {
        try {
            const tempToken = req.cookies['register_token'];
            const result = await authService.processVerifyRegisterCode(tempToken, req.body.Code);

            if (result.success) {
                res.clearCookie('register_token');
            }
            return res.json({ success: result.success, message: result.message });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
        }
    }

    async apiChangePassword(req, res) {
        if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập lại.' });
        try {
            const dto = new ChangePasswordDTO(req.body);
            const result = await authService.processChangePassword(req.user.Id, dto);
            return res.json({ success: result.success, message: result.message });
        } catch (err) {
            return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
        }
    }
}

module.exports = new AuthController();