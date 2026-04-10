// apps/models/TBGmailHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TBGmailHD = sequelize.define('TBGmailHD', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaHopDong:   { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:     { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'TBGmailHD',
  timestamps: false,
  underscored: false,
});

module.exports = TBGmailHD;
