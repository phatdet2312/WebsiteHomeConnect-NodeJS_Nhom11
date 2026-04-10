// apps/models/CT_NoiThat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaNoiThat, MaCanHo, MaHienTrang)
const CT_NoiThat = sequelize.define('CT_NoiThat', {
  MaNoiThat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaCanHo: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaHienTrang: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  SL: { type: DataTypes.INTEGER, allowNull: false },
  DonGia: { type: DataTypes.BIGINT, allowNull: false },
}, {
  tableName: 'CT_NoiThat',
  timestamps: false,
  underscored: false,
});

module.exports = CT_NoiThat;
