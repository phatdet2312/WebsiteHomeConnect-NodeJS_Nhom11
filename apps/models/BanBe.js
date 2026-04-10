// apps/models/BanBe.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaKHGui, MaKHNhan)
const BanBe = sequelize.define('BanBe', {
  MaKHGui: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaKHNhan: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  NgayGui: { type: DataTypes.DATE, allowNull: false },
  NgayDongY: { type: DataTypes.DATE, allowNull: true },
  TrangThai: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
  tableName: 'BanBe',
  timestamps: false,
  underscored: false,
});

module.exports = BanBe;
