// apps/models/KyTT.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KyTT = sequelize.define('KyTT', {
  MaKyTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenKyTT: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'KyTT',
  timestamps: false,
  underscored: false,
});

module.exports = KyTT;
