/// apps/models/DSA_HopDong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DSA_HopDong = sequelize.define('DSA_HopDong', {
  MaAnh: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaHopDong: { type: DataTypes.INTEGER, allowNull: true },
  UrlAnh: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'DSA_HopDong',
  timestamps: false,
  underscored: false,
});

module.exports = DSA_HopDong;
