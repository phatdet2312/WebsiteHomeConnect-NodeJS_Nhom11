// apps/models/VaiTroNhanVien.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VaiTroNhanVien = sequelize.define('VaiTroNhanVien', {
  MaVTNV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaNV:   { type: DataTypes.INTEGER, allowNull: false },
  ChucVu: { type: DataTypes.STRING,  allowNull: false },
}, {
  tableName: 'VaiTroNhanVien',
  timestamps: false,
  underscored: false,
});

module.exports = VaiTroNhanVien;
