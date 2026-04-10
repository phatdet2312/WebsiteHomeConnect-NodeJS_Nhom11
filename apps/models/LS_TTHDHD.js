// apps/models/LS_TTHDHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LS_TTHDHD = sequelize.define('LS_TTHDHD', {
  MaLS: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaHDHD: { type: DataTypes.INTEGER, allowNull: false },
  MaTT: { type: DataTypes.INTEGER, allowNull: true },
  ThoiGianThayDoi: { type: DataTypes.DATE, allowNull: false },
  GhiChu: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'LS_TTHDHD',
  timestamps: false,
  underscored: false,
});

module.exports = LS_TTHDHD;
