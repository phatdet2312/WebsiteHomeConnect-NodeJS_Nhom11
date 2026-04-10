// apps/models/BannerQuangCao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BannerQuangCao = sequelize.define('BannerQuangCao', {
  MaAQC: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  UrlAnh:      { type: DataTypes.STRING, allowNull: false },
  MoTa:        { type: DataTypes.STRING, allowNull: false },
  GhiChu:      { type: DataTypes.STRING, allowNull: true },
  UrlDichDen:  { type: DataTypes.STRING, allowNull: false },
  TTHienThi:   { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'BannerQuangCao',
  timestamps: false,
  underscored: false,
});

module.exports = BannerQuangCao;
