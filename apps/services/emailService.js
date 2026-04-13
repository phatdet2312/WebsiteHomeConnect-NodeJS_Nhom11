// apps/services/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_SERVER || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false }
});

const sendEmail = async ({ to, subject, html, text }) => {
  return transporter.sendMail({
    from: `"HomeConnect" <${process.env.SMTP_USER}>`,
    to, subject, html, text
  });
};

const sendOTP = async (email, code) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
      <div style="background:#1565c0;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h1 style="color:white;margin:0;font-size:28px;">🏠 HomeConnect</h1>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color:#333;">Xác thực tài khoản</h2>
        <p style="color:#555;">Mã xác thực của bạn là:</p>
        <div style="background:#e8f0fe;border:2px solid #1565c0;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
          <h1 style="color:#1565c0;font-size:40px;letter-spacing:10px;margin:0;font-weight:bold;">${code}</h1>
        </div>
        <p style="color:#888;font-size:14px;">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">
        <p style="color:#aaa;font-size:12px;text-align:center;">© 2025 HomeConnect. All rights reserved.</p>
      </div>
    </div>`;
  return sendEmail({ to: email, subject: '🔐 Mã xác thực HomeConnect', html });
};

const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const html = `
    <h2>📩 Liên hệ mới từ HomeConnect</h2>
    <table style="border-collapse:collapse;width:100%;">
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Họ tên</td><td style="padding:8px;border:1px solid #ddd;">${name}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Email</td><td style="padding:8px;border:1px solid #ddd;">${email}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Điện thoại</td><td style="padding:8px;border:1px solid #ddd;">${phone || 'Không cung cấp'}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Tiêu đề</td><td style="padding:8px;border:1px solid #ddd;">${subject}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold;">Nội dung</td><td style="padding:8px;border:1px solid #ddd;">${message.replace(/\n/g,'<br>')}</td></tr>
    </table>`;
  return sendEmail({ to: process.env.SMTP_USER, subject: `[HomeConnect Contact] ${subject}`, html });
};


// 3. Email thông báo tạo Hợp đồng mới
const sendContractCreatedEmail = async (email, tenKH, maHD, tenCanHo, giaThoaThuan) => {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
      <div style="background:#0061ff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🏠 HomeConnect</h2>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color:#333;">Xin chào ${tenKH},</h3>
        <p style="color:#555;line-height:1.6;">Chúng tôi xin trân trọng thông báo Hợp đồng của bạn đã được khởi tạo thành công trên hệ thống HomeConnect.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:10px;border:1px solid #eee;background:#f9f9f9;font-weight:bold;width:40%;">Mã hợp đồng</td><td style="padding:10px;border:1px solid #eee;color:#0061ff;font-weight:bold;">#${maHD}</td></tr>
          <tr><td style="padding:10px;border:1px solid #eee;background:#f9f9f9;font-weight:bold;">Căn hộ</td><td style="padding:10px;border:1px solid #eee;">${tenCanHo}</td></tr>
          <tr><td style="padding:10px;border:1px solid #eee;background:#f9f9f9;font-weight:bold;">Giá trị thỏa thuận</td><td style="padding:10px;border:1px solid #eee;color:#16a34a;font-weight:bold;">${Number(giaThoaThuan).toLocaleString('vi-VN')} VNĐ</td></tr>
        </table>
        <p style="color:#555;line-height:1.6;">Vui lòng đăng nhập vào hệ thống để xem chi tiết và theo dõi tiến độ hợp đồng.</p>
        <p style="color:#888;font-size:12px;text-align:center;margin-top:30px;">© 2025 HomeConnect. Xin cảm ơn quý khách!</p>
      </div>
    </div>`;
    return sendEmail({ to: email, subject: `[HomeConnect] Xác nhận khởi tạo Hợp đồng #${maHD}`, html });
};

// 4. Email thông báo cước Dịch vụ / Hợp đồng mới
const sendNewInvoiceAlert = async (email, tenKH, loaiPhi, dsCanHoLen, tongTien, ngayDenHan) => {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
      <div style="background:#f59e0b;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">🔔 Thông báo Cước phí Mới</h2>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color:#333;">Xin chào ${tenKH},</h3>
        <p style="color:#555;line-height:1.6;">Hệ thống HomeConnect vừa ghi nhận một khoản cước phí <b>${loaiPhi}</b> mới được gán cho ${dsCanHoLen} căn hộ của bạn.</p>
        <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:15px;margin:20px 0;">
            <p style="margin:0;font-size:14px;">Hạn thanh toán: <strong>${ngayDenHan || 'Không có hạn'}</strong></p>
        </div>
        <p style="color:#555;line-height:1.6;">Bạn vui lòng đăng nhập vào ứng dụng, truy cập mục <b>Quản lý lịch</b> hoặc <b>Thanh toán</b> để xem chi tiết và hoàn tất giao dịch.</p>
        <p style="color:#888;font-size:12px;text-align:center;margin-top:30px;">© 2025 HomeConnect.</p>
      </div>
    </div>`;
    return sendEmail({ to: email, subject: `[HomeConnect] Thông báo cước phí ${loaiPhi} mới`, html });
};

// 5. Email Biên lai Thanh toán (Khi User thanh toán xong)
const sendPaymentReceipt = async (email, tenKH, maHD, loaiPhi, tongTien, phuongThuc) => {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f5f5f5;">
      <div style="background:#16a34a;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
        <h2 style="color:white;margin:0;">✅ Thanh Toán Thành Công</h2>
      </div>
      <div style="background:white;padding:30px;border-radius:0 0 8px 8px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <h3 style="color:#333;">Xin chào ${tenKH},</h3>
        <p style="color:#555;line-height:1.6;">Chúng tôi xác nhận bạn đã thanh toán thành công khoản phí <b>${loaiPhi}</b>.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Mã giao dịch</td><td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">#${maHD}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Phương thức</td><td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">${phuongThuc}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #eee;color:#666;">Thời gian</td><td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;text-align:right;">${new Date().toLocaleString('vi-VN')}</td></tr>
          <tr><td style="padding:15px 10px;font-size:18px;font-weight:bold;color:#333;">Tổng thanh toán</td><td style="padding:15px 10px;font-size:18px;font-weight:bold;color:#16a34a;text-align:right;">${Number(tongTien).toLocaleString('vi-VN')} VNĐ</td></tr>
        </table>
        <p style="color:#888;font-size:12px;text-align:center;margin-top:30px;">Cảm ơn bạn đã sử dụng dịch vụ của HomeConnect!</p>
      </div>
    </div>`;
    return sendEmail({ to: email, subject: `[HomeConnect] Biên lai thanh toán #${maHD}`, html });
};

module.exports = { sendEmail, sendOTP, sendContactEmail, sendContractCreatedEmail, sendNewInvoiceAlert, sendPaymentReceipt };
