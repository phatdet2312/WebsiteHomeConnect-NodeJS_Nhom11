const canHoRepo = require('../repositories/canHoRepository');
const { Op } = require('sequelize');

class CanHoService {
    async getListKhamPha(dto) {
        const where = { TTHienThi: true };
        
        // Build query conditions
        if (dto.search) where[Op.or] = [{ TenCanHo: { [Op.like]: `%${dto.search}%` } }, { MoTa: { [Op.like]: `%${dto.search}%` } }];
        if (dto.minGia) where.Gia = { ...(where.Gia || {}), [Op.gte]: dto.minGia };
        if (dto.maxGia) where.Gia = { ...(where.Gia || {}), [Op.lte]: dto.maxGia };
        if (dto.loai === 'mua') where.Gia = { [Op.ne]: null };
        if (dto.loai === 'thue') where.GiaThue = { [Op.ne]: null };
        
        const tangWhere = dto.maToaNha ? { MaToaNha: dto.maToaNha } : {};

        // Query DB
        const { count, rows } = await canHoRepo.getPaginatedList(where, tangWhere, dto.limit, dto.offset);
        const toaNhas = await canHoRepo.getAllToaNha();

        return { 
            canHos: rows, 
            toaNhas: toaNhas, 
            total: count, 
            totalPages: Math.ceil(count / dto.limit), 
            currentPage: dto.page 
        };
    }

    async getCanHoDetail(id) {
        return await canHoRepo.getDetailById(id);
    }
}
module.exports = new CanHoService();