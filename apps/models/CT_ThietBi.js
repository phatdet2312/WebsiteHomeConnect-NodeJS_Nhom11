// apps/models/CT_ThietBi.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CT_ThietBi = sequelize.define('CT_ThietBi', {
  MaCT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaPhong:          { type: DataTypes.INTEGER,      allowNull: false },
  MaLoaiTB:         { type: DataTypes.INTEGER,      allowNull: false },
  TenThietBi:       { type: DataTypes.STRING(200),  allowNull: false, defaultValue: 'Thiết bị mới' },
  HangSanXuat:      { type: DataTypes.STRING,       allowNull: true },
  DeviceId:         { type: DataTypes.STRING,       allowNull: true },
  TrangThai:        { type: DataTypes.BOOLEAN,      allowNull: false, defaultValue: false },
  NhietDo:          { type: DataTypes.INTEGER,      allowNull: true },
  AmLuong:          { type: DataTypes.INTEGER,      allowNull: true },
  DoMoRem:          { type: DataTypes.INTEGER,      allowNull: true },
  ThoiGianThayDoi:  { type: DataTypes.DATE,         allowNull: false },
  ThoigianOnlineCuoi:{ type: DataTypes.DATE,        allowNull: false },
}, {
  tableName: 'CT_ThietBi',
  timestamps: false,
  underscored: false,
});

module.exports = CT_ThietBi;
