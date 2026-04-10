// apps/models/NhacNhoThongBao.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// C# class: NhacNhoThongBaoThong — tableName matches exactly
const NhacNhoThongBao = sequelize.define('NhacNhoThongBao', {
  MaNhacNho: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaSuKien:     { type: DataTypes.INTEGER, allowNull: false },
  NoiDung:      { type: DataTypes.STRING,  allowNull: false },
  ThoiGianNhac: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'NhacNhoThongBaoThong',
  timestamps: false,
  underscored: false,
});

module.exports = NhacNhoThongBao;
