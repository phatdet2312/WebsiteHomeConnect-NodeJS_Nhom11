// apps/models/VaiTroHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VaiTroHD = sequelize.define('VaiTroHD', {
  MaVaitroHD: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenVaiTro: { type: DataTypes.STRING(50), allowNull: false },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'VaiTroHD',
  timestamps: false,
  underscored: false,
});

module.exports = VaiTroHD;
