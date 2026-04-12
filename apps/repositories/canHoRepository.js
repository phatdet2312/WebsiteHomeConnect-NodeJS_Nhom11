const { CanHo, Tang, ToaNha, HienTrang, TTTTvaMucTT, DSA_CanHo, Phong, DSA_Phong, CT_NoiThat, NoiThat, DanhMucNoiThat, CT_DichVu, DichVu } = require('../models');
const { Op } = require('sequelize');

class CanHoRepository {
    async getFeaturedCanHo(limit = 8) {
        return await CanHo.findAll({
            where: { TTHienThi: true, TTDeXuat: true },
            include: [
                { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
                { model: DSA_CanHo, as: 'DSA_CanHos', limit: 3 }
            ],
            limit: limit,
            order: [['MaCanHo', 'DESC']]
        });
    }

    async searchSuggestions(keyword, limit = 10) {
        return await CanHo.findAll({
            where: { 
                [Op.or]: [{ TenCanHo: { [Op.like]: `%${keyword}%` } }, { MoTa: { [Op.like]: `%${keyword}%` } }], 
                TTHienThi: true 
            },
            include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }],
            limit: limit
        });
    }

    async getAllToaNha() {
        return await ToaNha.findAll({ where: { TTHienThi: true }, order: [['TenToaNha', 'ASC']] });
    }

    async getPaginatedList(whereClause, tangWhere, limit, offset) {
        return await CanHo.findAndCountAll({
            where: whereClause,
            limit: limit,
            offset: offset,
            include: [
                { model: Tang, as: 'Tang', where: Object.keys(tangWhere).length ? tangWhere : undefined, include: [{ model: ToaNha, as: 'ToaNha' }] },
                { model: HienTrang, as: 'HienTrang', required: false },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT', required: false },
                { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
            ],
            order: [['TTDeXuat', 'DESC'], ['MaCanHo', 'DESC']],
            subQuery: false
        });
    }

    async getDetailById(id) {
        return await CanHo.findOne({
            where: { MaCanHo: id, TTHienThi: true },
            include: [
                { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
                { model: HienTrang, as: 'HienTrang' },
                { model: TTTTvaMucTT, as: 'TTTTvaMucTT' },
                { model: DSA_CanHo, as: 'DSA_CanHos' },
                { model: Phong, as: 'Phongs', include: [{ model: DSA_Phong, as: 'DSA_Phongs' }] },
                { model: CT_NoiThat, as: 'CT_NoiThats', include: [
                    { model: NoiThat, as: 'NoiThat', include: [{ model: DanhMucNoiThat, as: 'DanhMucNoiThat' }] },
                    { model: HienTrang, as: 'HienTrangCT' }
                ]},
                { model: CT_DichVu, as: 'CT_DichVus', include: [{ model: DichVu, as: 'DichVu' }] }
            ]
        });
    }
}
module.exports = new CanHoRepository();