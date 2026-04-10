// apps/models/TTTTvaMucTT.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TTTTvaMucTT = sequelize.define('TTTTvaMucTT', {
  MaMucTT: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Ten: { type: DataTypes.STRING, allowNull: false },
  MucDo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 100 },
  },
  TTHienThi: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'TTTTvaMucTT',
  timestamps: false,
  underscored: false,
});

module.exports = TTTTvaMucTT;
