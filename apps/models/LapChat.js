// apps/models/LapChat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LapChat = sequelize.define('LapChat', {
  MaLapChat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaKH:       { type: DataTypes.INTEGER, allowNull: true },
  MaNV:       { type: DataTypes.INTEGER, allowNull: true },
  Ten:        { type: DataTypes.STRING,  allowNull: true },
  AvatarNhom: { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
  AnhNen:     { type: DataTypes.STRING,  allowNull: true, defaultValue: null },
  NgayTao:    { type: DataTypes.DATE,    allowNull: false },
  TTHienThi:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  NgayTat:    { type: DataTypes.DATE,    allowNull: true },
}, {
  tableName: 'LapChat',
  timestamps: false,
  underscored: false,
});

module.exports = LapChat;
