// apps/repositories/authRepository.js
const { ThongTinNguoiDung, KhachHang, MaXacThuc, sequelize } = require('../models');
const { Op } = require('sequelize');

class AuthRepository {
    async getUserRoles(userId) {
        const rolesData = await sequelize.query(
            `SELECT r.Name FROM AspNetRoles r INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId WHERE ur.UserId = :userId`,
            { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
        );
        return rolesData.map(r => r.Name);
    }

    async updateOfflineStatus(userId) {
        return await ThongTinNguoiDung.update(
            { TrangThaiHoatDong: false, ThoiGianOffline: new Date() },
            { where: { Id: userId } }
        );
    }

    async checkEmailOrUsernameExist(email, username) {
        return await ThongTinNguoiDung.findOne({
            where: { [Op.or]: [{ Email: email }, { UserName: username }] }
        });
    }

    async deleteOtpByEmail(email) {
        return await MaXacThuc.destroy({ where: { Email: email } });
    }

    async createOtpRecord(data) {
        return await MaXacThuc.create(data);
    }

    async findValidOtp(email, code) {
        return await MaXacThuc.findOne({
            where: {
                Email: email,
                MaXacNhan: code,
                DaSuDung: false,
                ThoiGianHetHan: { [Op.gt]: new Date() }
            }
        });
    }

    async findUnusedOtpByEmail(email) {
        return await MaXacThuc.findOne({ where: { Email: email, DaSuDung: false } });
    }

    async createUserWithRole(userData, khachHangData) {
        // Tạo User
        await ThongTinNguoiDung.create(userData);
        // Tạo bảng phụ Khách hàng
        await KhachHang.create(khachHangData);
        // Gán Role Customer bằng raw query (theo đúng logic cũ)
        try {
            await sequelize.query(
                `INSERT INTO AspNetUserRoles (UserId, RoleId) SELECT :uid, Id FROM AspNetRoles WHERE Name = 'Customer'`,
                { replacements: { uid: userData.Id } }
            );
        } catch (e) { console.error("Lỗi gán role Customer", e); }
    }

    async getUserById(userId) {
        return await ThongTinNguoiDung.findByPk(userId);
    }
}

module.exports = new AuthRepository();