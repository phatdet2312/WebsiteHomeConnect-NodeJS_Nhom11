// apps/models/DSA_Phong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DSA_Phong = sequelize.define('DSA_Phong', {
  MaAnh: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaPhong: { type: DataTypes.INTEGER, allowNull: false },
  UrlAnh: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'DSA_Phong',
  timestamps: false,
  underscored: false,
});

module.exports = DSA_Phong;
