const LocalStrategy = require('passport-local').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const { ExtractJwt } = require('passport-jwt');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { ThongTinNguoiDung, KhachHang, NhanVien, sequelize } = require('../models');
const { Op } = require('sequelize');

// Xác thực PBKDF2 của C#
function verifyAspNetHash(password, hash) {
  try {
    const buf = Buffer.from(hash, 'base64');
    const version = buf[0];
    if (version === 0x01) {
      const prf = buf.readUInt32BE(1);
      const iter = buf.readUInt32BE(5);
      const saltLen = buf.readUInt32BE(9);
      const salt = buf.slice(13, 13 + saltLen);
      const expected = buf.slice(13 + saltLen);
      const algo = prf === 2 ? 'sha512' : prf === 1 ? 'sha256' : 'sha1';
      const derived = crypto.pbkdf2Sync(password, salt, iter, expected.length, algo);
      return crypto.timingSafeEqual(derived, expected);
    } else if (version === 0x00) {
      const salt = buf.slice(1, 17);
      const expected = buf.slice(17);
      const derived = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha1');
      return crypto.timingSafeEqual(derived, expected);
    }
    return false;
  } catch { return false; }
}

// Trích xuất JWT từ HttpOnly Cookie (Cho Web) hoặc Header (Cho Mobile App)
const cookieExtractor = function (req) {
  let token = null;
  if (req && req.cookies) token = req.cookies['auth_token'];
  return token;
};

module.exports = function (passport) {

  // 1. CHIẾN LƯỢC ĐĂNG NHẬP LOCAL (Kiểm tra pass)
  passport.use('local', new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const user = await ThongTinNguoiDung.findOne({
          where: { [Op.or]: [{ Email: email }, { UserName: email }, { PhoneNumber: email }] }
        });
        if (!user) return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });
        

        let isMatch = false;
        if (user.PasswordHash.startsWith('$2')) isMatch = await bcrypt.compare(password, user.PasswordHash);
        else isMatch = verifyAspNetHash(password, user.PasswordHash);

        if (!isMatch) return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });
        return done(null, user);
      } catch (err) { return done(err); }
    }
  ));

  // 2. CHIẾN LƯỢC JWT TỐI THƯỢNG (Thay thế hoàn toàn Session deserialize)
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
    secretOrKey: process.env.JWT_SECRET || 'DayLaMotSecretKeyRatDaiVaAnToanChoHS256JwtToken2025!'
  };

  passport.use('jwt', new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      const user = await ThongTinNguoiDung.findByPk(jwt_payload.id);
      if (!user) return done(null, false);

      // Phục hồi relation data (Roles, NhanVien, KhachHang)
      const roles = await sequelize.query(
        `SELECT r.Name FROM AspNetRoles r INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId WHERE ur.UserId = :userId`,
        { replacements: { userId: user.Id }, type: sequelize.QueryTypes.SELECT }
      );
      user.dataValues.roles = roles.map(r => r.Name);

      const [khachHang, nhanVien] = await Promise.all([
        KhachHang.findOne({ where: { UserId: user.Id } }),
        NhanVien.findOne({ where: { UserId: user.Id } })
      ]);
      user.dataValues.KhachHang = khachHang;
      user.dataValues.NhanVien = nhanVien;

      return done(null, user);
    } catch (err) { return done(err, false); }
  }));
};