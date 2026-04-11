const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { ThongTinNguoiDung, KhachHang, MaXacThuc, sequelize } = require('../models');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'DayLaMotSecretKeyRatDaiVaAnToanChoHS256JwtToken2025!';

// ==========================================
// 1. ĐĂNG NHẬP LOCAL (API JSON)
// ==========================================
router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/login', { title: 'Đăng nhập - HomeConnect', layout: 'layouts/main' });
});

// Chuyển thành API JSON
router.post('/api/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    if (err) return res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    if (!user) return res.status(401).json({ success: false, message: info ? info.message : 'Đăng nhập thất bại' });

    // 1. Ký JWT Token
    const token = jwt.sign(
      { id: user.Id }, 
      JWT_SECRET, 
      { expiresIn: '7d' } 
    );

    // 2. Gửi Token qua HTTP-Only Cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    // 3. Lấy Roles để client biết đường điều hướng
    let redirectUrl = '/';
    try {
        const rolesData = await sequelize.query(
            `SELECT r.Name FROM AspNetRoles r INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId WHERE ur.UserId = :userId`,
            { replacements: { userId: user.Id }, type: sequelize.QueryTypes.SELECT }
        );
        const roles = rolesData.map(r => r.Name);
        if (roles.includes('Admin') || roles.includes('Employee') || user.IsSuperAdmin) {
            redirectUrl = '/admin/dashboard';
        }
    } catch (e) { console.error(e); }

    return res.json({ 
        success: true, 
        message: 'Đăng nhập thành công', 
        redirectUrl: redirectUrl 
    });
  })(req, res, next);
});

// ==========================================
// 2. ĐĂNG NHẬP GOOGLE (OAUTH2)
// ==========================================
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Callback của Google buộc phải xài redirect vì đây là cơ chế của trình duyệt chuyển trang
router.get('/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false, failureRedirect: '/auth/login', failureFlash: true }, async (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      req.flash('error_msg', 'Đăng nhập Google thất bại');
      return res.redirect('/auth/login');
    }

    const token = jwt.sign({ id: user.Id }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 
    });

    let redirectUrl = '/';
    try {
        const rolesData = await sequelize.query(
            `SELECT r.Name FROM AspNetRoles r INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId WHERE ur.UserId = :userId`,
            { replacements: { userId: user.Id }, type: sequelize.QueryTypes.SELECT }
        );
        const roles = rolesData.map(r => r.Name);
        if (roles.includes('Admin') || roles.includes('Employee') || user.IsSuperAdmin) redirectUrl = '/admin/dashboard';
    } catch (e) {}

    res.redirect(redirectUrl);
  })(req, res, next);
});

// ==========================================
// 3. ĐĂNG XUẤT
// ==========================================
router.get('/logout', async (req, res) => {
  if (req.user) {
    try {
      await ThongTinNguoiDung.update(
        { TrangThaiHoatDong: false, ThoiGianOffline: new Date() },
        { where: { Id: req.user.Id } }
      );
    } catch (e) { console.error("Lỗi cập nhật offline:", e); }
  }
  
  res.clearCookie('auth_token');
  req.user = null;
  req.flash('success_msg', 'Đã đăng xuất thành công');
  res.redirect('/auth/login');
});

// ==========================================
// 4. ĐĂNG KÝ & OTP (STATELESS API)
// ==========================================
router.get('/register', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/');
  res.render('auth/register', { title: 'Đăng ký - HomeConnect', layout: 'layouts/main' });
});

router.post('/api/register/send-code', async (req, res) => {
  try {
    const { HoTen, UserName, Email, Password, ConfirmPassword } = req.body;

    if (!HoTen || !UserName || !Email || !Password) return res.json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
    if (Password !== ConfirmPassword) return res.json({ success: false, message: 'Mật khẩu xác nhận không khớp' });
    if (Password.length < 6) return res.json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });

    const existing = await ThongTinNguoiDung.findOne({
      where: { [Op.or]: [{ Email: Email.toLowerCase() }, { UserName }] }
    });
    if (existing) return res.json({ success: false, message: 'Email hoặc tên đăng nhập đã được sử dụng' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await MaXacThuc.destroy({ where: { Email: Email.toLowerCase() } });
    await MaXacThuc.create({
      Email:          Email.toLowerCase(),
      MaXacNhan:      code,
      ThoiGianTao:    new Date(),
      ThoiGianHetHan: new Date(Date.now() + 10 * 60 * 1000), 
      DaSuDung:       false,
      SoLanThu:       0
    });

    await emailService.sendOTP(Email, code);

    // TẠO JWT TẠM THỜI
    const registerPayload = { HoTen, UserName, Email: Email.toLowerCase(), Password };
    const tempToken = jwt.sign(registerPayload, JWT_SECRET, { expiresIn: '15m' });
    
    res.cookie('register_token', tempToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });

    return res.json({ success: true, message: 'Mã xác thực đã gửi đến email của bạn.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

router.post('/api/register/verify-code', async (req, res) => {
  try {
    const { Code } = req.body;
    
    const tempToken = req.cookies['register_token'];
    if (!tempToken) return res.json({ success: false, message: 'Phiên đăng ký hết hạn, vui lòng tải lại trang và thử lại.' });

    let rd;
    try {
        rd = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
        return res.json({ success: false, message: 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.' });
    }

    const record = await MaXacThuc.findOne({
      where: {
        Email:          rd.Email,
        MaXacNhan:      Code.trim(),
        DaSuDung:       false,
        ThoiGianHetHan: { [Op.gt]: new Date() }
      }
    });

    if (!record) {
      const existingRecord = await MaXacThuc.findOne({ where: { Email: rd.Email, DaSuDung: false }});
      if(existingRecord) await existingRecord.increment('SoLanThu');
      return res.json({ success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' });
    }

    await record.update({ DaSuDung: true });

    const hashedPwd = await bcrypt.hash(rd.Password, 12);
    const userId = uuidv4();

    await ThongTinNguoiDung.create({
      Id: userId,
      UserName: rd.UserName,
      NormalizedUserName: rd.UserName.toUpperCase(),
      Email: rd.Email,
      NormalizedEmail: rd.Email.toUpperCase(),
      EmailConfirmed: true,
      PasswordHash: hashedPwd,
      SecurityStamp: uuidv4(),
      ConcurrencyStamp: uuidv4(),
      HoTen: rd.HoTen,
      IsSuperAdmin: false,
      TrangThaiHoatDong: false,
      PhoneNumberConfirmed: false,
      TwoFactorEnabled: false,
      LockoutEnabled: true, 
      AccessFailedCount: 0
    });

    await KhachHang.create({ UserId: userId, TenKH: rd.HoTen, EmailKH: rd.Email });

    try {
      await sequelize.query(
        `INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT :uid, Id FROM AspNetRoles WHERE Name = 'Customer'`,
        { replacements: { uid: userId } }
      );
    } catch (e) { console.error("Lỗi gán role Customer", e); }

    res.clearCookie('register_token');
    
    return res.json({ success: true, message: 'Tạo tài khoản thành công! Đang chuyển hướng...' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

// ==========================================
// 5. ĐỔI MẬT KHẨU (API JSON)
// ==========================================
router.get('/change-password', (req, res) => {
  if (!req.isAuthenticated()) return res.redirect('/auth/login');
  res.render('auth/changePassword', { title: 'Đổi mật khẩu', layout: 'layouts/main' });
});

router.post('/api/change-password', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập lại.'});
  
  try {
    const { OldPassword, NewPassword, ConfirmPassword } = req.body;
    if (NewPassword !== ConfirmPassword) {
      return res.json({ success: false, message: 'Mật khẩu mới không khớp.'});
    }
    const user = await ThongTinNguoiDung.findByPk(req.user.Id);
    if (!user.PasswordHash || !user.PasswordHash.startsWith('$2')) {
      return res.json({ success: false, message: 'Tài khoản này đăng nhập bằng Google, không có mật khẩu để thay đổi.'});
    }
    const isMatch = await bcrypt.compare(OldPassword, user.PasswordHash);
    if (!isMatch) {
      return res.json({ success: false, message: 'Mật khẩu hiện tại không đúng.'});
    }
    
    await user.update({ PasswordHash: await bcrypt.hash(NewPassword, 12) });
    return res.json({ success: true, message: 'Đổi mật khẩu thành công! Hệ thống sẽ đưa bạn về trang chủ.'});
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Lỗi hệ thống: ' + err.message });
  }
});

module.exports = router;