// apps/models/NhanVien.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NhanVien = sequelize.define('NhanVien', {
  MaNV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UserId: { type: DataTypes.STRING, allowNull: false },
  TenNV: { type: DataTypes.STRING(100), allowNull: false },
  NgaySinhNV: { type: DataTypes.DATE, allowNull: true },
  DiaChiNV: { type: DataTypes.STRING, allowNull: true },
  DTNV: { type: DataTypes.STRING, allowNull: true },
  EmailNV: { type: DataTypes.STRING, allowNull: true },
  AvatarUrl: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'NhanVien',
  timestamps: false,
  underscored: false,
});

module.exports = NhanVien;
