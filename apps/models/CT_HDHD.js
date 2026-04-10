// apps/models/CT_HDHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaLoaiTT, MaCanHo, MaKyTT, MaHDHD)
const CT_HDHD = sequelize.define('CT_HDHD', {
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
  MaHDHD: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  SL: { type: DataTypes.INTEGER, allowNull: false },
  PhanTramThuc: { type: DataTypes.INTEGER, allowNull: true },
  DonGia: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName: 'CT_HDHD',
  timestamps: false,
  underscored: false,
});

module.exports = CT_HDHD;
