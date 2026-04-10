// apps/models/LoaiHopDong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoaiHopDong = sequelize.define('LoaiHopDong', {
  MaLoaiHD: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenLoai: { type: DataTypes.STRING(50), allowNull: false },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'LoaiHopDong',
  timestamps: false,
  underscored: false,
});

module.exports = LoaiHopDong;
