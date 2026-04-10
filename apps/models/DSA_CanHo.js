// apps/models/DSA_CanHo.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DSA_CanHo = sequelize.define('DSA_CanHo', {
  MaAnh: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaCanHo: { type: DataTypes.INTEGER, allowNull: false },
  UrlAnh: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'DSA_CanHo',
  timestamps: false,
  underscored: false,
});

module.exports = DSA_CanHo;
