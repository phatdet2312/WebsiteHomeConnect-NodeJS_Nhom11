const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const authRepo = require('../repositories/authRepository');
const emailService = require('./emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'DayLaMotSecretKeyRatDaiVaAnToanChoHS256JwtToken2025!';

class AuthService {
    // Ký token
    generateAuthToken(userId) {
        return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
    }

    // Lấy link điều hướng dựa vào Role
    async getRedirectUrlForUser(user) {
        let redirectUrl = '/';
        try {
            const roles = await authRepo.getUserRoles(user.Id);
            if (roles.includes('Admin') || roles.includes('Employee') || user.IsSuperAdmin) {
                redirectUrl = '/admin/dashboard';
            }
        } catch (e) { console.error(e); }
        return redirectUrl;
    }

    async processSendRegisterCode(dto) {
        const error = dto.validate();
        if (error) return { success: false, message: error };

        const existing = await authRepo.checkEmailOrUsernameExist(dto.Email, dto.UserName);
        if (existing) return { success: false, message: 'Email hoặc tên đăng nhập đã được sử dụng' };

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        await authRepo.deleteOtpByEmail(dto.Email);
        await authRepo.createOtpRecord({
            Email: dto.Email,
            MaXacNhan: code,
            ThoiGianTao: new Date(),
            ThoiGianHetHan: new Date(Date.now() + 10 * 60 * 1000), // 10 phút
            DaSuDung: false,
            SoLanThu: 0
        });

        await emailService.sendOTP(dto.Email, code);

        const registerPayload = { HoTen: dto.HoTen, UserName: dto.UserName, Email: dto.Email, Password: dto.Password };
        const tempToken = jwt.sign(registerPayload, JWT_SECRET, { expiresIn: '15m' });

        return { success: true, message: 'Mã xác thực đã gửi đến email của bạn.', tempToken };
    }

    async processVerifyRegisterCode(tempToken, code) {
        if (!tempToken) return { success: false, message: 'Phiên đăng ký hết hạn, vui lòng tải lại trang và thử lại.' };

        let rd;
        try {
            rd = jwt.verify(tempToken, JWT_SECRET);
        } catch (e) {
            return { success: false, message: 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.' };
        }

        const record = await authRepo.findValidOtp(rd.Email, code.trim());

        if (!record) {
            const existingRecord = await authRepo.findUnusedOtpByEmail(rd.Email);
            if (existingRecord) await existingRecord.increment('SoLanThu');
            return { success: false, message: 'Mã OTP không đúng hoặc đã hết hạn.' };
        }

        await record.update({ DaSuDung: true });

        const hashedPwd = await bcrypt.hash(rd.Password, 12);
        const userId = uuidv4();

        const userData = {
            Id: userId,
            UserName: rd.UserName, NormalizedUserName: rd.UserName.toUpperCase(),
            Email: rd.Email, NormalizedEmail: rd.Email.toUpperCase(),
            EmailConfirmed: true, PasswordHash: hashedPwd,
            SecurityStamp: uuidv4(), ConcurrencyStamp: uuidv4(),
            HoTen: rd.HoTen, IsSuperAdmin: false, TrangThaiHoatDong: false,
            PhoneNumberConfirmed: false, TwoFactorEnabled: false, LockoutEnabled: true, AccessFailedCount: 0
        };

        const khachHangData = { UserId: userId, TenKH: rd.HoTen, EmailKH: rd.Email };

        await authRepo.createUserWithRole(userData, khachHangData);

        return { success: true, message: 'Tạo tài khoản thành công! Đang chuyển hướng...' };
    }

    async processChangePassword(userId, dto) {
        const error = dto.validate();
        if (error) return { success: false, message: error };

        const user = await authRepo.getUserById(userId);
        if (!user.PasswordHash || !user.PasswordHash.startsWith('$2')) {
            return { success: false, message: 'Tài khoản này đăng nhập bằng Google, không có mật khẩu để thay đổi.' };
        }

        const isMatch = await bcrypt.compare(dto.OldPassword, user.PasswordHash);
        if (!isMatch) {
            return { success: false, message: 'Mật khẩu hiện tại không đúng.' };
        }

        const newHash = await bcrypt.hash(dto.NewPassword, 12);
        await user.update({ PasswordHash: newHash });

        return { success: true, message: 'Đổi mật khẩu thành công! Hệ thống sẽ đưa bạn về trang chủ.' };
    }
}

module.exports = new AuthService();