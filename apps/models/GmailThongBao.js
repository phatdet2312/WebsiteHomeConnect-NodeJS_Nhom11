// apps/models/GmailThongBao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const GmailThongBao = sequelize.define('GmailThongBao', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaLS:        { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:     { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'GmailThongBao',
  timestamps: false,
  underscored: false,
});

module.exports = GmailThongBao;
