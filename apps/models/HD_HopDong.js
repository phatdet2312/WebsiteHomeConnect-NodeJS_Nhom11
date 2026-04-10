// apps/models/HD_HopDong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HD_HopDong = sequelize.define('HD_HopDong', {
  MaHDHD: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaHopDong: { type: DataTypes.INTEGER, allowNull: true },
  MaPT: { type: DataTypes.INTEGER, allowNull: true },
  NgayThanhToan: { type: DataTypes.DATE, allowNull: false },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'HD_HopDong',
  timestamps: false,
  underscored: false,
});

module.exports = HD_HopDong;
