const { Lich, SuKien, HopDong, DichVu, CT_DichVu, CT_HDDV, LS_TTHDDV, TrangThai, CT_ThanhToan, LoaiTTHD, CT_HDHD, LS_TTHDHD, CanHo, Tang, ToaNha, Ky, KyTT, sequelize } = require('../models');
const { Op } = require('sequelize');

class QuanLyLichRepository {
    // --- LỊCH CÁ NHÂN ---
    async getLichsByKhach(maKH) {
        return await Lich.findAll({ where: { MaKH: maKH }, order: [['MaLich', 'ASC']] });
    }

    async createLich(maKH, data) {
        return await Lich.create({ MaKH: maKH, ...data });
    }

    async findLichById(id, maKH) {
        return await Lich.findOne({ where: { MaLich: id, MaKH: maKH } });
    }

    async deleteLich(id, maKH) {
        return await Lich.destroy({ where: { MaLich: id, MaKH: maKH } });
    }

    // --- SỰ KIỆN CÁ NHÂN ---
    async getEvents(maLichList, startDate, endDate) {
        return await SuKien.findAll({
            where: {
                MaLich: maLichList,
                ThoiGianBatDau: { [Op.lte]: endDate },
                ThoiGIanKetThuc: { [Op.gte]: startDate }
            },
            include: [{ model: Lich, as: 'Lich' }],
            order: [['ThoiGianBatDau', 'ASC']]
        });
    }

    async createEvent(data) {
        return await SuKien.create(data);
    }

    async findEventById(id, maKH) {
        return await SuKien.findByPk(id, { include: [{ model: Lich, as: 'Lich', where: { MaKH: maKH } }] });
    }

    // --- HÓA ĐƠN ---
    async getActiveHopDongs(maKH) {
        return await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
    }

    async getTrangThaiByName(name) {
        const tt = await TrangThai.findOne({ where: { TenTT: name } });
        return tt ? tt.MaTT : null;
    }

    // Dịch vụ
    async getLockedDichVuIds(maTTPaid, maTTInProg) {
        let rows = [];
        if (maTTPaid) {
            const p = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }).catch(() => []);
            rows.push(...p.map(r => r.MaHDDV));
        }
        if (maTTInProg) {
            const i = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProg } }).catch(() => []);
            rows.push(...i.map(r => r.MaHDDV));
        }
        return [...new Set(rows)];
    }

    async getPaidAmountDV(lockedIds) {
        if (!lockedIds.length) return {};
        const ct_hddvs = await CT_HDDV.findAll({ where: { MaHDDV: lockedIds } });
        const paidMap = {};
        ct_hddvs.forEach(ct => {
            const key = `${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`;
            paidMap[key] = (paidMap[key] || 0) + (ct.DonGia * (ct.SL || 1));
        });
        return paidMap;
    }

    async getCTDichVuByCanHo(maCanHoList) {
        return await CT_DichVu.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
    }

    async getAllDichVuDict() {
        const dvs = await DichVu.findAll();
        const dict = {}; dvs.forEach(d => dict[d.MaDV] = d);
        return dict;
    }

    // Hợp đồng
    async getLockedHopDongIds(maTTPaid, maTTInProg) {
        let rows = [];
        if (maTTPaid) {
            const p = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }).catch(() => []);
            rows.push(...p.map(r => r.MaHDHD));
        }
        if (maTTInProg) {
            const i = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProg } }).catch(() => []);
            rows.push(...i.map(r => r.MaHDHD));
        }
        return [...new Set(rows)];
    }

    async getPaidAmountHD(lockedIds) {
        if (!lockedIds.length) return {};
        const ct_hdhds = await CT_HDHD.findAll({ where: { MaHDHD: lockedIds } });
        const paidMap = {};
        ct_hdhds.forEach(ct => {
            const key = `${ct.MaLoaiTT}_${ct.MaCanHo}_${ct.MaKyTT}`;
            paidMap[key] = (paidMap[key] || 0) + (ct.DonGia * (ct.SL || 1));
        });
        return paidMap;
    }

    async getCTThanhToanByCanHo(maCanHoList) {
        return await CT_ThanhToan.findAll({ where: { MaCanHo: maCanHoList, Gia: { [Op.gt]: 0 } } });
    }

    async getAllLoaiTTHDDict() {
        const loais = await LoaiTTHD.findAll();
        const dict = {}; loais.forEach(l => dict[l.MaLoaiTT] = l);
        return dict;
    }
}
module.exports = new QuanLyLichRepository();