// apps/models/TinNhan.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TinNhan = sequelize.define('TinNhan', {
  MaTin: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaLapChat: { type: DataTypes.INTEGER, allowNull: false },
  MaKH:      { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:   { type: DataTypes.TEXT,    allowNull: true },
  NgayGui:   { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'TinNhan',
  timestamps: false,
  underscored: false,
});

module.exports = TinNhan;
