// apps/models/PTTT.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PTTT = sequelize.define('PTTT', {
  MaPT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenPT: { type: DataTypes.STRING(50), allowNull: false },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'PTTT',
  timestamps: false,
  underscored: false,
});

module.exports = PTTT;
