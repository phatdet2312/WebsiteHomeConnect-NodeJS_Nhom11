// apps/models/Phong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Phong = sequelize.define('Phong', {
  MaPhong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaCanHo: { type: DataTypes.INTEGER, allowNull: false },
  TenPhong: { type: DataTypes.STRING(100), allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'Phong',
  timestamps: false,
  underscored: false,
});

module.exports = Phong;
