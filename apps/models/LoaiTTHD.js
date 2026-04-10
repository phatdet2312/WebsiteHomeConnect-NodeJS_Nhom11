// apps/models/LoaiTTHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoaiTTHD = sequelize.define('LoaiTTHD', {
  MaLoaiTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenLoaiTT: { type: DataTypes.STRING, allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  UrlIcon: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'LoaiTTHD',
  timestamps: false,
  underscored: false,
});

module.exports = LoaiTTHD;
