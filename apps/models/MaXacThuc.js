// apps/models/MaXacThuc.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaXacThuc = sequelize.define('MaXacThuc', {
  Id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Email:          { type: DataTypes.STRING,  allowNull: false },
  MaXacNhan:      { type: DataTypes.STRING,  allowNull: false },
  ThoiGianTao:    { type: DataTypes.DATE,    allowNull: false },
  ThoiGianHetHan: { type: DataTypes.DATE,    allowNull: false },
  DaSuDung:       { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  SoLanThu:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, {
  tableName: 'MaXacThuc',
  timestamps: false,
  underscored: false,
});

module.exports = MaXacThuc;
