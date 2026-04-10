// apps/models/HopDong.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const HopDong = sequelize.define('HopDong', {
  MaHopDong: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  MaKH: { type: DataTypes.INTEGER, allowNull: false },
  MaCanHo: { type: DataTypes.INTEGER, allowNull: false },
  MaLoaiHD: { type: DataTypes.INTEGER, allowNull: false },
  MaVaiTroHD: { type: DataTypes.INTEGER, allowNull: false },
  MaNV: { type: DataTypes.INTEGER, allowNull: true },
  GiaTriCanHo: { type: DataTypes.BIGINT, allowNull: true },
  GiaThoaThuan: { type: DataTypes.BIGINT, allowNull: true },
  NgayLap: { type: DataTypes.DATE, allowNull: false },
  NgayXuLyDuKien: { type: DataTypes.DATE, allowNull: true },
  NgayHieuLuc: { type: DataTypes.DATE, allowNull: true },
  NgayHetHan: { type: DataTypes.DATE, allowNull: true },
  DiaChiKyHopDong: { type: DataTypes.STRING, allowNull: true },
  UrlAnhHD: { type: DataTypes.STRING, allowNull: true },
  SDTNhanLienLac: { type: DataTypes.STRING, allowNull: true },
  SoLanDoiTT: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  TrangThaiHD: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: null, field: 'TrạngThaiHD' },
}, {
  tableName: 'HopDong',
  timestamps: false,
  underscored: false,
});

module.exports = HopDong;
