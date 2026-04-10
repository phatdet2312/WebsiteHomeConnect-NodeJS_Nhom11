// apps/models/DanhMucNoiThat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DanhMucNoiThat = sequelize.define('DanhMucNoiThat', {
  MaDMNT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenDMNT: { type: DataTypes.STRING(100), allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'DanhMucNoiThat',
  timestamps: false,
  underscored: false,
});

module.exports = DanhMucNoiThat;
