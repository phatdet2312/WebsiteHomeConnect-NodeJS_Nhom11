require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const flash = require('connect-flash');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser'); 

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '1gb' }));
app.use(express.urlencoded({ extended: true, limit: '1gb' }));
app.use(cookieParser()); 
app.use(methodOverride('_method'));

// Cấu hình Passport
require('./apps/config/passport')(passport);
app.use(passport.initialize());

// Middleware Mock Flash (Vì không dùng Session)
app.use((req, res, next) => {
  req.flash = function(type, msg) {
      if (msg) {
          res.cookie('flash_' + type, msg, { maxAge: 2000, httpOnly: true });
      } else {
          const val = req.cookies['flash_' + type];
          res.clearCookie('flash_' + type);
          return val ? [val] : [];
      }
  };
  next();
});

// Middleware lấy user cho các View (Render UI) thông qua Passport JWT
app.use((req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err, user) => {
        req.user = user || null;
        req.isAuthenticated = () => !!user;
        
        res.locals.user = req.user;
        res.locals.isAuthenticated = req.isAuthenticated();
        res.locals.success_msg = req.flash('success_msg');
        res.locals.error_msg = req.flash('error_msg');
        res.locals.error = req.flash('error');
        res.locals.currentPath = req.path;
        
        next();
    })(req, res, next);
});

const activityMiddleware = require('./apps/middleware/activityTracker');
app.use(activityMiddleware);

// Routes
const homeRoutes = require('./apps/routes/home');
const authRoutes = require('./apps/routes/auth');
const canhoRoutes = require('./apps/routes/canho');
const chiTietCanHoRoutes = require('./apps/routes/chiTietCanHo');
const khamPhaRoutes = require('./apps/routes/khamPha');
const hoaDonDichVuRoutes = require('./apps/routes/hoaDonDichVu');
const hoaDonHopDongRoutes = require('./apps/routes/hoaDonHopDong');
const thanhToanMuaThueRoutes = require('./apps/routes/thanhToanMuaThue');
const quanLyLichRoutes = require('./apps/routes/quanLyLich');
const shoppingCartRoutes = require('./apps/routes/shoppingCart');
const adminRoutes = require('./apps/routes/admin/index');
const apiRoutes = require('./apps/routes/api');

app.use('/api', apiRoutes);
app.use('/', homeRoutes);
app.use('/auth', authRoutes);
app.use('/can-ho', canhoRoutes);
app.use('/chi-tiet-can-ho', chiTietCanHoRoutes);
app.use('/kham-pha', khamPhaRoutes);
app.use('/hoa-don-dich-vu', hoaDonDichVuRoutes);
app.use('/hoa-don-hop-dong', hoaDonHopDongRoutes);
app.use('/thanh-toan-mua-thue', thanhToanMuaThueRoutes);
app.use('/quan-ly-lich', quanLyLichRoutes);
app.use('/gio-hang', shoppingCartRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Không tìm thấy trang', layout: 'layouts/main' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('errors/500', { title: 'Lỗi server', layout: 'layouts/main', error: err.message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  const { sequelize } = require('./apps/models');
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});

module.exports = app;