
//app/middleware/auth.js
const passport = require('passport');

// Hàm Helper để xử lý JWT Auth chung
const authenticateJWT = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) return next(err);

    // Nếu không có user (chưa đăng nhập hoặc token sai/hết hạn)
    if (!user) {
      // Nếu request là gọi API (có header accept application/json hoặc path bắt đầu bằng /api)
      if (req.xhr || req.headers.accept?.indexOf('json') > -1 || req.path.startsWith('/api')) {
        return res.status(401).json({ success: false, message: 'Unauthorized. Token hết hạn hoặc không hợp lệ.' });
      }
      // Nếu là request load view bình thường
      req.flash('error_msg', 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      return res.redirect('/auth/login');
    }
    req.user = user;
    next();
  })(req, res, next);
};

exports.isAuthenticated = authenticateJWT;

exports.isCustomer = [authenticateJWT, (req, res, next) => {
  const roles = (req.user && req.user.dataValues && req.user.dataValues.roles) || [];
  if (roles.includes('Customer') || req.user.IsSuperAdmin) return next();
  res.render('errors/access-denied', { title: 'Không có quyền truy cập', layout: 'layouts/main' });
}];

exports.isAdmin = [authenticateJWT, (req, res, next) => {
  const roles = (req.user && req.user.dataValues && req.user.dataValues.roles) || [];
  if (roles.includes('Admin') || req.user.IsSuperAdmin) return next();

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(403).json({ success: false, message: 'Forbidden. Cần quyền Admin.' });
  }
  res.redirect('/auth/login');
}];

exports.isAdminOrEmployee = [authenticateJWT, (req, res, next) => {
  const roles = (req.user && req.user.dataValues && req.user.dataValues.roles) || [];
  if (roles.includes('Admin') || roles.includes('Employee') || req.user.IsSuperAdmin) return next();

  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(403).json({ success: false, message: 'Forbidden. Không đủ quyền hạn.' });
  }
  res.redirect('/auth/login');
}];