//
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TBGmailHDDV = sequelize.define('TBGmailHDDV', {
  MaTB: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaLS:        { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:     { type: DataTypes.STRING,  allowNull: false },
  ThoiGianGui: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'TBGmailHDDV',
  timestamps: false,
  underscored: false,
});

module.exports = TBGmailHDDV;
