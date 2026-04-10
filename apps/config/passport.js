const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Verify ASP.NET Identity v2/v3 PBKDF2 password hash
function verifyAspNetHash(password, hash) {
  try {
    const buf = Buffer.from(hash, 'base64');
    const version = buf[0];

    if (version === 0x01) {
      // v3: [0x01][prf:4][iter:4][saltLen:4][salt][subkey]
      const prf      = buf.readUInt32BE(1);
      const iter     = buf.readUInt32BE(5);
      const saltLen  = buf.readUInt32BE(9);
      const salt     = buf.slice(13, 13 + saltLen);
      const expected = buf.slice(13 + saltLen);
      const algo     = prf === 2 ? 'sha512' : prf === 1 ? 'sha256' : 'sha1';
      const keyLen   = expected.length;
      const derived  = crypto.pbkdf2Sync(password, salt, iter, keyLen, algo);
      return crypto.timingSafeEqual(derived, expected);
    } else if (version === 0x00) {
      // v2: [0x00][salt:16][subkey:32] — PBKDF2-HMAC-SHA1, 1000 iter
      const salt     = buf.slice(1, 17);
      const expected = buf.slice(17);
      const derived  = crypto.pbkdf2Sync(password, salt, 1000, 32, 'sha1');
      return crypto.timingSafeEqual(derived, expected);
    }
    return false;
  } catch {
    return false;
  }
}

module.exports = function(passport) {
  passport.use('local', new LocalStrategy(
    { usernameField: 'email', passwordField: 'password' },
    async (email, password, done) => {
      try {
        const { ThongTinNguoiDung } = require('../models');
        const { Op } = require('sequelize');
        const user = await ThongTinNguoiDung.findOne({
          where: {
            [Op.or]: [
              { Email: email },
              { UserName: email },
              { PhoneNumber: email }
            ]
          }
        });
        if (!user) return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });

        if (!user.PasswordHash) {
          return done(null, false, { message: 'Tài khoản này đăng nhập bằng Google' });
        }

        // Verify password — supports both bcrypt (Node.js) and PBKDF2 (ASP.NET Identity v2/v3)
        let isMatch = false;
        if (user.PasswordHash.startsWith('$2')) {
          isMatch = await bcrypt.compare(password, user.PasswordHash);
        } else {
          isMatch = verifyAspNetHash(password, user.PasswordHash);
        }

        if (!isMatch) return done(null, false, { message: 'Email hoặc mật khẩu không đúng' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.use('google', new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { ThongTinNguoiDung, KhachHang, sequelize } = require('../models');
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        if (!email) return done(null, false, { message: 'Không lấy được email từ Google' });

        let user = await ThongTinNguoiDung.findOne({ where: { Email: email } });
        if (!user) {
          const userId = uuidv4();
          user = await ThongTinNguoiDung.create({
            Id: userId,
            UserName: email,
            NormalizedUserName: email.toUpperCase(),
            Email: email,
            NormalizedEmail: email.toUpperCase(),
            EmailConfirmed: true,
            PasswordHash: null,
            SecurityStamp: uuidv4(),
            ConcurrencyStamp: uuidv4(),
            HoTen: profile.displayName || email,
            IsSuperAdmin: false,
            TrangThaiHoatDong: false,
            PhoneNumberConfirmed: false,
            TwoFactorEnabled: false,
            LockoutEnabled: true,
            AccessFailedCount: 0
          });
          await KhachHang.create({
            UserId: userId,
            TenKH: profile.displayName || email,
            EmailKH: email,
            AvatarUrl: (profile.photos && profile.photos[0]) ? profile.photos[0].value : null
          });
          // Assign Customer role
          try {
            await sequelize.query(
              `INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT :userId, Id FROM AspNetRoles WHERE Name = 'Customer'`,
              { replacements: { userId } }
            );
          } catch (roleErr) { /* role may already exist */ }
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => {
    done(null, user.Id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const { ThongTinNguoiDung, KhachHang, NhanVien, sequelize } = require('../models');
      const user = await ThongTinNguoiDung.findByPk(id);
      if (!user) return done(null, false);

      // Get roles
      const roles = await sequelize.query(
        `SELECT r.Name FROM AspNetRoles r INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId WHERE ur.UserId = :userId`,
        { replacements: { userId: id }, type: sequelize.QueryTypes.SELECT }
      );
      user.dataValues.roles = roles.map(r => r.Name);

      // Get KhachHang and NhanVien
      const [khachHang, nhanVien] = await Promise.all([
        KhachHang.findOne({ where: { UserId: id } }),
        NhanVien.findOne({ where: { UserId: id } })
      ]);
      user.dataValues.KhachHang = khachHang;
      user.dataValues.NhanVien = nhanVien;

      done(null, user);
    } catch (err) {
      done(err);
    }
  });
};
