//apps/dtos/auth.dto.js

class RegisterSendCodeDTO {
    constructor(data) {
        this.HoTen = data.HoTen?.trim();
        this.UserName = data.UserName?.trim();
        this.Email = data.Email?.trim().toLowerCase();
        this.Password = data.Password;
        this.ConfirmPassword = data.ConfirmPassword;
    }

    validate() {
        if (!this.HoTen || !this.UserName || !this.Email || !this.Password) 
            return 'Vui lòng điền đầy đủ thông tin';
        if (this.Password !== this.ConfirmPassword) 
            return 'Mật khẩu xác nhận không khớp';
        if (this.Password.length < 6) 
            return 'Mật khẩu phải có ít nhất 6 ký tự';
        return null; // Hợp lệ
    }
}

class ChangePasswordDTO {
    constructor(data) {
        this.OldPassword = data.OldPassword;
        this.NewPassword = data.NewPassword;
        this.ConfirmPassword = data.ConfirmPassword;
    }

    validate() {
        if (this.NewPassword !== this.ConfirmPassword) 
            return 'Mật khẩu mới không khớp.';
        return null;
    }
}

module.exports = { RegisterSendCodeDTO, ChangePasswordDTO };