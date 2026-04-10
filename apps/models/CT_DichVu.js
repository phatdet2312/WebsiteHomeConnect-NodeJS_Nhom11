// apps/models/CT_DichVu.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaDV, MaCanHo, MaKy)
const CT_DichVu = sequelize.define('CT_DichVu', {
  MaDV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaCanHo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaKy: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  Gia: { type: DataTypes.BIGINT, allowNull: true },
  NgayDenHan: { type: DataTypes.DATE, allowNull: true },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
  urlAnh: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'CT_DichVu',
  timestamps: false,
  underscored: false,
});

module.exports = CT_DichVu;
