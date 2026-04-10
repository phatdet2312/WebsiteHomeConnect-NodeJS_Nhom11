// apps/models/CT_LapChat.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Composite PK: (MaLapChat, MaKH)
const CT_LapChat = sequelize.define('CT_LapChat', {
  MaLapChat: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  MaKH: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
  },
  Ten:                 { type: DataTypes.STRING, allowNull: true, defaultValue: null },
  NgayThemThanhVien:   { type: DataTypes.DATE,   allowNull: false },
  TTHienThi:           { type: DataTypes.BOOLEAN,allowNull: false, defaultValue: true },
  NgayDocTin:          { type: DataTypes.DATE,   allowNull: true },
  NgayXoaTin:          { type: DataTypes.DATE,   allowNull: true },
}, {
  tableName: 'CT_LapChat',
  timestamps: false,
  underscored: false,
});

module.exports = CT_LapChat;
