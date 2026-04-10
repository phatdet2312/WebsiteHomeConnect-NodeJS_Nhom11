// apps/models/ThongTinNguoiDung.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ThongTinNguoiDung = sequelize.define('ThongTinNguoiDung', {
  Id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  UserName: { type: DataTypes.STRING, allowNull: true },
  NormalizedUserName: { type: DataTypes.STRING, allowNull: true },
  Email: { type: DataTypes.STRING, allowNull: true },
  NormalizedEmail: { type: DataTypes.STRING, allowNull: true },
  EmailConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  PasswordHash: { type: DataTypes.STRING, allowNull: true },
  SecurityStamp: { type: DataTypes.STRING, allowNull: true },
  ConcurrencyStamp: { type: DataTypes.STRING, allowNull: true },
  PhoneNumber: { type: DataTypes.STRING, allowNull: true },
  PhoneNumberConfirmed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  TwoFactorEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  LockoutEnd: { type: DataTypes.DATE, allowNull: true },
  LockoutEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  AccessFailedCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  HoTen: { type: DataTypes.STRING, allowNull: true },
  DiaChi: { type: DataTypes.STRING, allowNull: true },
  NgaySinh: { type: DataTypes.DATE, allowNull: true },
  SDT: { type: DataTypes.STRING, allowNull: true },
  IsSuperAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  ThoiGianBatDauOnline: { type: DataTypes.DATE, allowNull: true },
  ThoiGianOffline: { type: DataTypes.DATE, allowNull: true },
  TrangThaiHoatDong: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'AspNetUsers',
  timestamps: false,
  underscored: false,
});

module.exports = ThongTinNguoiDung;
