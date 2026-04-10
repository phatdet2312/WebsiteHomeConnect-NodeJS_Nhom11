// apps/models/Tang.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Tang = sequelize.define('Tang', {
  MaTang: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaToaNha: { type: DataTypes.INTEGER, allowNull: false },
  TenTang: { type: DataTypes.STRING(100), allowNull: false },
  SoHanhLang: { type: DataTypes.INTEGER, allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'Tang',
  timestamps: false,
  underscored: false,
});

module.exports = Tang;
