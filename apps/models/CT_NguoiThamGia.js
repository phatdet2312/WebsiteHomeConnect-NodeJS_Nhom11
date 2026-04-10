// apps/models/CT_NguoiThamGia.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaKH, MaSuKien)
const CT_NguoiThamGia = sequelize.define('CT_NguoiThamGia', {
  MaKH: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaSuKien: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  VaiTroSuKien:    { type: DataTypes.INTEGER, allowNull: false },
  ThoiGianThamGia: { type: DataTypes.DATE,    allowNull: false },
}, {
  tableName: 'CT_NguoiThamGia',
  timestamps: false,
  underscored: false,
});

module.exports = CT_NguoiThamGia;
