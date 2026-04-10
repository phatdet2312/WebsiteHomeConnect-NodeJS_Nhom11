// apps/models/ChiSoSucKhoe.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChiSoSucKhoe = sequelize.define('ChiSoSucKhoe', {
  MaSucKhoe: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaKH:               { type: DataTypes.INTEGER, allowNull: false },
  NhipTim_Bpm:        { type: DataTypes.DOUBLE,  allowNull: true },
  OxyMau_Sp02:        { type: DataTypes.DOUBLE,  allowNull: true },
  NhipTho_Breath:     { type: DataTypes.INTEGER, allowNull: true },
  HuyetAp_Pressure:   { type: DataTypes.STRING,  allowNull: true },
  DoCanThang_Stress:  { type: DataTypes.STRING,  allowNull: true },
  HVR:                { type: DataTypes.DOUBLE,  allowNull: true },
  ThoiGianDo:         { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'ChiSoSucKhoe',
  timestamps: false,
  underscored: false,
});

module.exports = ChiSoSucKhoe;
