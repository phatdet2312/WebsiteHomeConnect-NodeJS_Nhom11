// apps/models/FileChat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FileChat = sequelize.define('FileChat', {
  MaFile: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaTin:     { type: DataTypes.INTEGER,    allowNull: false },
  TenFile:   { type: DataTypes.STRING,     allowNull: true },
  LoaiFile:  { type: DataTypes.STRING(10), allowNull: false },
  KichThuoc: { type: DataTypes.BIGINT,     allowNull: false },
  DuongDan:  { type: DataTypes.STRING(200),allowNull: false },
  TrangThai: { type: DataTypes.BOOLEAN,    allowNull: false, defaultValue: true },
}, {
  tableName: 'FileChat',
  timestamps: false,
  underscored: false,
});

module.exports = FileChat;
