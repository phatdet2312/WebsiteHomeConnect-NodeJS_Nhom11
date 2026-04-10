// apps/models/ToaNha.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ToaNha = sequelize.define('ToaNha', {
  MaToaNha: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenToaNha: { type: DataTypes.STRING(100), allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'ToaNha',
  timestamps: false,
  underscored: false,
});

module.exports = ToaNha;
