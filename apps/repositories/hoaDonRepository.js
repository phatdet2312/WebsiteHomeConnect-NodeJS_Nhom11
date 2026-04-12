const { TrangThai, PTTT, HopDong, sequelize } = require('../models');

class HoaDonRepository {
    async layMaTrangThai(tenTT) {
        const tt = await TrangThai.findOne({ where: { TenTT: tenTT } });
        return tt ? tt.MaTT : null;
    }

    async getAllPTTT() {
        return await PTTT.findAll({ where: { TTHienThi: true }, order: [['TenPT', 'ASC']] });
    }

    async getActiveHopDongs(maKH) {
        return await HopDong.findAll({ where: { MaKH: maKH, TrangThaiHD: true } });
    }

    async getAllHopDongsByKhach(maKH) {
        return await HopDong.findAll({ where: { MaKH: maKH } });
    }

    async getCurrentHopDong(maKH) {
        return await HopDong.findOne({ where: { MaKH: maKH, TrangThaiHD: true }, order: [['NgayLap', 'DESC']] });
    }

    // --- LOGIC KHÓA HÓA ĐƠN DỊCH VỤ ---
    async getHoaDonBiKhoaDV(maTTPaid, maTTInProgress) {
        let rows = [];
        if (maTTPaid) {
            const p = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }).catch(() => []);
            rows.push(...p.map(r => r.MaHDDV));
        }
        if (maTTInProgress) {
            const i = await sequelize.query(`SELECT l.MaHDDV FROM LS_TTHDDV l INNER JOIN (SELECT MaHDDV, MAX(MaLS) as MaxLS FROM LS_TTHDDV GROUP BY MaHDDV) m ON l.MaHDDV = m.MaHDDV AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProgress } }).catch(() => []);
            rows.push(...i.map(r => r.MaHDDV));
        }
        return [...new Set(rows)];
    }

    async getTongDaThanhToanDV(maDV, maCanHo, maKy, lockedIds) {
        if (!lockedIds.length) return 0;
        const rows = await sequelize.query(`SELECT ISNULL(SUM(ct.DonGia * ct.SL), 0) as tongDaThanhToan FROM CT_HDDV ct WHERE ct.MaDV = :maDV AND ct.MaCanHo = :maCanHo AND ct.MaKy = :maKy AND ct.MaHDDV IN (:ids)`, { type: sequelize.QueryTypes.SELECT, replacements: { maDV, maCanHo, maKy, ids: lockedIds } }).catch(() => [{ tongDaThanhToan: 0 }]);
        return parseInt(rows[0]?.tongDaThanhToan || 0);
    }

    // --- LOGIC KHÓA HÓA ĐƠN HỢP ĐỒNG ---
    async getHoaDonBiKhoaHD(maTTPaid, maTTInProgress) {
        let rows = [];
        if (maTTPaid) {
            const p = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTPaid } }).catch(() => []);
            rows.push(...p.map(r => r.MaHDHD));
        }
        if (maTTInProgress) {
            const i = await sequelize.query(`SELECT l.MaHDHD FROM LS_TTHDHD l INNER JOIN (SELECT MaHDHD, MAX(MaLS) as MaxLS FROM LS_TTHDHD GROUP BY MaHDHD) m ON l.MaHDHD = m.MaHDHD AND l.MaLS = m.MaxLS WHERE l.MaTT = :maTT AND l.ThoiGianThayDoi >= DATEADD(second, -45, GETDATE())`, { type: sequelize.QueryTypes.SELECT, replacements: { maTT: maTTInProgress } }).catch(() => []);
            rows.push(...i.map(r => r.MaHDHD));
        }
        return [...new Set(rows)];
    }

    async getTongDaThanhToanHD(maLoaiTT, maCanHo, maKyTT, lockedIds) {
        if (!lockedIds.length) return 0;
        const rows = await sequelize.query(`SELECT ISNULL(SUM(ct.DonGia * ct.SL), 0) as tongDaThanhToan FROM CT_HDHD ct WHERE ct.MaLoaiTT = :maLoaiTT AND ct.MaCanHo = :maCanHo AND ct.MaKyTT = :maKyTT AND ct.MaHDHD IN (:ids)`, { type: sequelize.QueryTypes.SELECT, replacements: { maLoaiTT, maCanHo, maKyTT, ids: lockedIds } }).catch(() => [{ tongDaThanhToan: 0 }]);
        return parseInt(rows[0]?.tongDaThanhToan || 0);
    }
}
module.exports = new HoaDonRepository();