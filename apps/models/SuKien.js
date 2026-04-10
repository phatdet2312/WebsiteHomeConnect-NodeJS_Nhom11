// apps/models/SuKien.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SuKien = sequelize.define('SuKien', {
  MaSuKien: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaLich:          { type: DataTypes.INTEGER, allowNull: false },
  TieuDe:          { type: DataTypes.STRING,  allowNull: false },
  ThoiGianBatDau:  { type: DataTypes.DATE,    allowNull: false },
  ThoiGIanKetThuc: { type: DataTypes.DATE,    allowNull: false },
  DiaDiem:         { type: DataTypes.STRING,  allowNull: true },
  MoTa:            { type: DataTypes.STRING,  allowNull: true },
}, {
  tableName: 'SuKien',
  timestamps: false,
  underscored: false,
});

module.exports = SuKien;
