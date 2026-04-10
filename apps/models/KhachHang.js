// apps/models/KhachHang.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KhachHang = sequelize.define('KhachHang', {
  MaKH: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserId: { type: DataTypes.STRING, allowNull: false },
  TenKH: { type: DataTypes.STRING(100), allowNull: false },
  NgaySinhKH: { type: DataTypes.DATE, allowNull: true },
  DiaChiKH: { type: DataTypes.STRING, allowNull: true },
  DTKH: { type: DataTypes.STRING, allowNull: true },
  EmailKH: { type: DataTypes.STRING, allowNull: true },
  AvatarUrl: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'KhachHang',
  timestamps: false,
  underscored: false,
});

module.exports = KhachHang;
