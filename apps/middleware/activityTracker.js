//apps/middleware/activityTracker.js
let lastUpdate = {};

module.exports = async (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user && req.user.Id) {
    const userId = req.user.Id;
    const now = Date.now();
    // Throttle: update at most once every 60 seconds per user
    if (!lastUpdate[userId] || now - lastUpdate[userId] > 60000) {
      lastUpdate[userId] = now;
      try {
        const { ThongTinNguoiDung } = require('../models');
        const updates = { ThoiGianOffline: new Date() };
        if (!req.user.TrangThaiHoatDong) {
          updates.TrangThaiHoatDong = true;
          updates.ThoiGianBatDauOnline = new Date();
        }
        await ThongTinNguoiDung.update(updates, { where: { Id: userId } });
      } catch (err) {
        // Non-blocking
      }
    }
  }
  next();
};
