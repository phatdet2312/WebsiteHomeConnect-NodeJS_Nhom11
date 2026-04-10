// apps/models/CT_ThanhToan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaLoaiTT, MaCanHo, MaKyTT)
const CT_ThanhToan = sequelize.define('CT_ThanhToan', {
  MaLoaiTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaCanHo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaKyTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  Gia: { type: DataTypes.BIGINT, allowNull: true },
  NgayDenHan: { type: DataTypes.DATE, allowNull: true },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'CT_ThanhToan',
  timestamps: false,
  underscored: false,
});

module.exports = CT_ThanhToan;
