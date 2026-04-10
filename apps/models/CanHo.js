// apps/models/CanHo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CanHo = sequelize.define('CanHo', {
  MaCanHo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaTang: { type: DataTypes.INTEGER, allowNull: false },
  MaHienTrang: { type: DataTypes.INTEGER, allowNull: true },
  MaMucTT: { type: DataTypes.INTEGER, allowNull: true },
  TenCanHo: { type: DataTypes.STRING(200), allowNull: false },
  ViTriDay: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 10 },
  },
  ThuTu: { type: DataTypes.INTEGER, allowNull: false },
  Gia: { type: DataTypes.BIGINT, allowNull: true },
  GiaThue: { type: DataTypes.BIGINT, allowNull: true },
  MoTa: { type: DataTypes.TEXT, allowNull: true },
  Dai: { type: DataTypes.DOUBLE, allowNull: true },
  Rong: { type: DataTypes.DOUBLE, allowNull: true },
  Cao: { type: DataTypes.DOUBLE, allowNull: true },
  UrlAnh: { type: DataTypes.STRING, allowNull: true },
  TamNhin: { type: DataTypes.STRING, allowNull: true },
  TTDeXuat: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'CanHo',
  timestamps: false,
  underscored: false,
});

module.exports = CanHo;
