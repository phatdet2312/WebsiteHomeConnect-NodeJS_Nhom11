// apps/models/HD_DichVu.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HD_DichVu = sequelize.define('HD_DichVu', {
  MaHDDV: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaKH: { type: DataTypes.INTEGER, allowNull: false },
  MaPT: { type: DataTypes.INTEGER, allowNull: false },
  NgayThanhToan: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'HD_DichVu',
  timestamps: false,
  underscored: false,
});

module.exports = HD_DichVu;
