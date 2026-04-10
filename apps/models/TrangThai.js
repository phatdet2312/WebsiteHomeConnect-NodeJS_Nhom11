// apps/models/TrangThai.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TrangThai = sequelize.define('TrangThai', {
  MaTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenTT: { type: DataTypes.STRING(50), allowNull: false },
  UrlAnh: { type: DataTypes.STRING, allowNull: true },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'TrangThai',
  timestamps: false,
  underscored: false,
});

module.exports = TrangThai;
