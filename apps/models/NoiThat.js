// apps/models/NoiThat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NoiThat = sequelize.define('NoiThat', {
  MaNoiThat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaDMNT: { type: DataTypes.INTEGER, allowNull: false },
  TenNoiThat: { type: DataTypes.STRING(100), allowNull: false },
  Gia: { type: DataTypes.BIGINT, allowNull: true },
  MoTa: { type: DataTypes.TEXT, allowNull: true },
  UrlAnh: { type: DataTypes.STRING, allowNull: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'NoiThat',
  timestamps: false,
  underscored: false,
});

module.exports = NoiThat;
