// apps/models/Lich.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Lich = sequelize.define('Lich', {
  MaLich: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaKH:    { type: DataTypes.INTEGER, allowNull: false },
  TenLich: { type: DataTypes.STRING,  allowNull: true },
  MauSac:  { type: DataTypes.STRING,  allowNull: true },
  ThoiGian:{ type: DataTypes.DATE,    allowNull: true },
  MoTa:    { type: DataTypes.TEXT,    allowNull: true },
}, {
  tableName: 'Lich',
  timestamps: false,
  underscored: false,
});

module.exports = Lich;
