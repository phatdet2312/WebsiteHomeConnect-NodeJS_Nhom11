// apps/routes/khamPha.js
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// GET / - Discover apartments
router.get('/', (_req, res) => {
  res.render('khamPha/index', { title: 'Khám phá căn hộ - HomeConnect', layout: 'layouts/main' });
});

// ==========================================
// CÁC API KHÁM PHÁ TRƯỚC ĐÂY NẰM Ở api.js
// ==========================================

// GET /kham-pha/api/list?search&minGia&maxGia&maToaNha&loai&page
router.get('/api/list', async (req, res) => {
  try {
    const { CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT, DSA_CanHo } = require('../models');
    const { search, minGia, maxGia, maToaNha, loai, page = 1 } = req.query;
    const limit = 12;
    const offset = (parseInt(page) - 1) * limit;
    
    const where = { TTHienThi: true };
    if (search) where[Op.or] = [{ TenCanHo: { [Op.like]: `%${search}%` } }, { MoTa: { [Op.like]: `%${search}%` } }];
    if (minGia) where.Gia = { ...(where.Gia || {}), [Op.gte]: parseInt(minGia) };
    if (maxGia) where.Gia = { ...(where.Gia || {}), [Op.lte]: parseInt(maxGia) };
    if (loai === 'mua') where.Gia = { [Op.ne]: null };
    if (loai === 'thue') where.GiaThue = { [Op.ne]: null };
    
    const tangWhere = maToaNha ? { MaToaNha: maToaNha } : {};
    
    const { count, rows } = await CanHo.findAndCountAll({
      where, limit, offset,
      include: [
        { model: Tang, as: 'Tang', where: Object.keys(tangWhere).length ? tangWhere : undefined, include: [{ model: ToaNha, as: 'ToaNha' }] },
        { model: HienTrang, as: 'HienTrang', required: false },
        { model: TTTTvaMucTT, as: 'TTTTvaMucTT', required: false },
        { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
      ],
      order: [['TTDeXuat','DESC'],['MaCanHo','DESC']],
      subQuery: false
    });
    
    const toaNhas = await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha','ASC']] });
    res.json({ canHos: rows, toaNhas, total: count, totalPages: Math.ceil(count / limit), currentPage: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;