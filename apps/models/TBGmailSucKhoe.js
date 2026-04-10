// apps/models/TBGmailSucKhoe.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TBGmailSucKhoe = sequelize.define('TBGmailSucKhoe', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaSucKhoe:       { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:         { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui:     { type: DataTypes.DATE,    allowNull: false },
  TrangThaiXemTB:  { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'TBGmailSucKhoe',
  timestamps: false,
  underscored: false,
});

module.exports = TBGmailSucKhoe;
