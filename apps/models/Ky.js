
// apps/models/Ky.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Ky = sequelize.define('Ky', {
  MaKy: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  TenKy: { type: DataTypes.STRING, allowNull: false },
}, {
  tableName: 'Ky',
  timestamps: false,
  underscored: false,
});

module.exports = Ky;
