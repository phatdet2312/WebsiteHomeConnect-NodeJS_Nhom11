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

module.exports = { sendEmail, sendOTP, sendContactEmail };
