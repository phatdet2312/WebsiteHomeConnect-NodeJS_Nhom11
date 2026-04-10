// apps/models/TBGmailNhacNhoLich.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TBGmailNhacNhoLich = sequelize.define('TBGmailNhacNhoLich', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaSuKien:    { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:     { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'TBGmailNhacNhoLich',
  timestamps: false,
  underscored: false,
});

module.exports = TBGmailNhacNhoLich;
