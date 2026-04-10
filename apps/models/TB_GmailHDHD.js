// apps/models/TB_GmailHDHD.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TB_GmailHDHD = sequelize.define('TB_GmailHDHD', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaLS:        { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:     { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'TB_GmailHDHD',
  timestamps: false,
  underscored: false,
});

module.exports = TB_GmailHDHD;
