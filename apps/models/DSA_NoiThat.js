// apps/models/DSA_NoiThat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DSA_NoiThat = sequelize.define('DSA_NoiThat', {
  MaAnh: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  MaCanHo:    { type: DataTypes.INTEGER, allowNull: false },
  MaNoiThat:  { type: DataTypes.INTEGER, allowNull: false },
  MaHienTrang:{ type: DataTypes.INTEGER, allowNull: false },
  UrlAnh:     { type: DataTypes.STRING,  allowNull: false },
}, {
  tableName: 'DSA_NoiThat',
  timestamps: false,
  underscored: false,
});

module.exports = DSA_NoiThat;
