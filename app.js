require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('passport');
const methodOverride = require('method-override');
const expressLayouts = require('express-ejs-layouts');
const cookieParser = require('cookie-parser');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body & Cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// Passport Initialization
require('./apps/config/passport')(passport);
app.use(passport.initialize());

// Middleware Mock Flash
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

// Middleware xác thực JWT toàn cục
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

// ================= ROUTES =================
const authRoutes = require('./apps/routes/auth');

// Trang chủ (Bắt buộc đăng nhập mới được vào)
app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error_msg', 'Vui lòng đăng nhập để truy cập hệ thống.');
        return res.redirect('/auth/login');
    }
    res.render('home/index', { title: 'Trang chủ - HomeConnect' });
});

// Route Auth (Đăng nhập, Đăng ký, Đổi mật khẩu)
app.use('/auth', authRoutes);
// ==========================================

// 404 handler
app.use((req, res) => {
  res.status(404).render('errors/404', { title: 'Không tìm thấy trang', layout: 'layouts/main' });
});

// Error handler
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