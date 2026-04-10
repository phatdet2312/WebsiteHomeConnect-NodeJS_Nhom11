// apps/models/LS_TTHDDV.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LS_TTHDDV = sequelize.define('LS_TTHDDV', {
  MaLS: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaHDDV: { type: DataTypes.INTEGER, allowNull: false },
  MaTT: { type: DataTypes.INTEGER, allowNull: true },
  ThoiGianThayDoi: { type: DataTypes.DATE, allowNull: false },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'LS_TTHDDV',
  timestamps: false,
  underscored: false,
});

module.exports = LS_TTHDDV;
