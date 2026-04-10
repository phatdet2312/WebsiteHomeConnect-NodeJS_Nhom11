// apps/models/LS_TaiFile.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LS_TaiFile = sequelize.define('LS_TaiFile', {
  MaLST: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaFile:    { type: DataTypes.INTEGER, allowNull: false },
  MaLapChat: { type: DataTypes.INTEGER, allowNull: true },
  MaKH:      { type: DataTypes.INTEGER, allowNull: true },
  NgayTai:   { type: DataTypes.DATE,    allowNull: false },
  TrangThai: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null },
}, {
  tableName: 'LS_TaiFile',
  timestamps: false,
  underscored: false,
});

module.exports = LS_TaiFile;
