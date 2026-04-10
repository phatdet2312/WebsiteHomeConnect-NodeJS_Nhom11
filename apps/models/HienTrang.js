// apps/models/HienTrang.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HienTrang = sequelize.define('HienTrang', {
  MaHienTrang: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenHienTrang: { type: DataTypes.STRING(50), allowNull: false },
  MucDo: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: { min: 1, max: 100 },
  },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'HienTrang',
  timestamps: false,
  underscored: false,
});

module.exports = HienTrang;
