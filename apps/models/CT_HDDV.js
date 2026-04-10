// apps/models/CT_HDDV.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaDV, MaCanHo, MaKy, MaHDDV)
const CT_HDDV = sequelize.define('CT_HDDV', {
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
  MaHDDV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  SL: { type: DataTypes.INTEGER, allowNull: false },
  DonGia: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName: 'CT_HDDV',
  timestamps: false,
  underscored: false,
});

module.exports = CT_HDDV;
