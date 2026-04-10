// apps/models/LoaiThietBi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoaiThietBi = sequelize.define('LoaiThietBi', {
  MaLoaiTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenLoai: { type: DataTypes.STRING(100), allowNull: false },
  Icon:    { type: DataTypes.STRING,      allowNull: false },
  MauSac:  { type: DataTypes.STRING,      allowNull: true, defaultValue: '#F28C38' },
}, {
  tableName: 'LoaiThietBi',
  timestamps: false,
  underscored: false,
});

module.exports = LoaiThietBi;
