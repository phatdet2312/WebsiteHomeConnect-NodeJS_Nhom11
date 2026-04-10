// apps/models/DichVu.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DichVu = sequelize.define('DichVu', {
  MaDV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenDV: { type: DataTypes.STRING, allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  UrlIcon: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'DichVu',
  timestamps: false,
  underscored: false,
});

module.exports = DichVu;
