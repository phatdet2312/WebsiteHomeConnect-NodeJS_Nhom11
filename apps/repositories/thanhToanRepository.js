const { CanHo, Tang, ToaNha, DSA_CanHo, PTTT, HopDong } = require('../models');

class ThanhToanRepository {
    async getCanHoDetailsInCart(maCanHoList) {
        return await CanHo.findAll({
            where: { MaCanHo: maCanHoList },
            include: [
                { model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] },
                { model: DSA_CanHo, as: 'DSA_CanHos', limit: 1 }
            ]
        });
    }

    async getCanHoById(maCanHo) {
        return await CanHo.findOne({
            where: { MaCanHo: maCanHo, TTHienThi: true },
            include: [{ model: Tang, as: 'Tang', include: [{ model: ToaNha, as: 'ToaNha' }] }]
        });
    }

    async getAllPTTT() {
        return await PTTT.findAll({ order: [['TenPT', 'ASC']] });
    }

    async createHopDong(data) {
        return await HopDong.create(data);
    }
}

module.exports = new ThanhToanRepository();