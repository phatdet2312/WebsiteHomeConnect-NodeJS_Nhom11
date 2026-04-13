const { sequelize, KhachHang, CanHo, HopDong } = require('../../models');

class ThongKeRepository {
    async getBasicCounts() {
        return await Promise.all([
            KhachHang.count(),
            CanHo.count(),
            HopDong.count({ where: { TrangThaiHD: null } }),
            HopDong.count({ where: { TrangThaiHD: true } }),
            HopDong.count({ where: { TrangThaiHD: false } })
        ]);
    }

    async getDoanhThuTheoThang() {
        return await sequelize.query(
            `SELECT FORMAT(NgayLap,'yyyy-MM') as period, COUNT(h.MaHopDong) as soHopDong, SUM(ISNULL(h.GiaThoaThuan, 0)) as tongDoanhThu
             FROM HopDong h WHERE h.[TrạngThaiHD] = 1 AND NgayLap >= DATEADD(month, -11, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
             GROUP BY FORMAT(NgayLap,'yyyy-MM') ORDER BY period ASC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getTopCanHo() {
        return await sequelize.query(
            `SELECT TOP 10 c.MaCanHo, c.TenCanHo, COUNT(h.MaHopDong) as soHopDong, SUM(ISNULL(h.GiaThoaThuan, 0)) as tongGiaTri
             FROM CanHo c LEFT JOIN HopDong h ON c.MaCanHo = h.MaCanHo AND h.[TrạngThaiHD] = 1
             GROUP BY c.MaCanHo, c.TenCanHo ORDER BY soHopDong DESC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getDoanhThuToaNha() {
        return await sequelize.query(
            `SELECT tn.MaToaNha, tn.TenToaNha, COUNT(DISTINCT h.MaHopDong) as soHopDong, SUM(ISNULL(h.GiaThoaThuan, 0)) as tongDoanhThu
             FROM ToaNha tn INNER JOIN Tang t ON tn.MaToaNha = t.MaToaNha INNER JOIN CanHo c ON t.MaTang = c.MaTang
             LEFT JOIN HopDong h ON c.MaCanHo = h.MaCanHo AND h.[TrạngThaiHD] = 1
             GROUP BY tn.MaToaNha, tn.TenToaNha ORDER BY tongDoanhThu DESC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getTyLeCanHo() {
        const result = await sequelize.query(
            `SELECT SUM(CASE WHEN c.MaHienTrang IS NOT NULL THEN 1 ELSE 0 END) as daSuDung,
                    SUM(CASE WHEN c.MaHienTrang IS NULL THEN 1 ELSE 0 END) as chuaSuDung, COUNT(*) as tong
             FROM CanHo c WHERE c.TTHienThi = 1`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => [{ daSuDung: 0, chuaSuDung: 0, tong: 0 }]);
        return result[0];
    }

    async getKhachHangMoi() {
        return await sequelize.query(
            `SELECT FORMAT(u.ThoiGianBatDauOnline,'yyyy-MM') as period, COUNT(k.MaKH) as soKhachHang
             FROM KhachHang k INNER JOIN AspNetUsers u ON k.UserId = u.Id
             WHERE u.ThoiGianBatDauOnline >= DATEADD(month, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
             GROUP BY FORMAT(u.ThoiGianBatDauOnline,'yyyy-MM') ORDER BY period ASC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getThuNhapDichVu() {
        return await sequelize.query(
            `SELECT FORMAT(hd.NgayThanhToan,'yyyy-MM') as period, SUM(ISNULL(ct.DonGia * ct.SL, 0)) as tongThu
             FROM HD_DichVu hd INNER JOIN CT_HDDV ct ON hd.MaHDDV = ct.MaHDDV
             WHERE hd.NgayThanhToan >= DATEADD(month, -5, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
             GROUP BY FORMAT(hd.NgayThanhToan,'yyyy-MM') ORDER BY period ASC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getChiTietDoanhThu(tuNgay, denNgay, limit, offset) {
        let dateFilter = '';
        const replacements = { offset, limit };
        if (tuNgay) { dateFilter += ' AND h.NgayLap >= :tuNgay'; replacements.tuNgay = tuNgay; }
        if (denNgay) { dateFilter += ' AND h.NgayLap <= :denNgay'; replacements.denNgay = denNgay; }

        return await sequelize.query(
            `SELECT h.MaHopDong, h.NgayLap, h.GiaThoaThuan, k.TenKH, c.TenCanHo, tn.TenToaNha, t.TenTang
             FROM HopDong h INNER JOIN KhachHang k ON h.MaKH = k.MaKH
             INNER JOIN CanHo c ON h.MaCanHo = c.MaCanHo INNER JOIN Tang t ON c.MaTang = t.MaTang INNER JOIN ToaNha tn ON t.MaToaNha = tn.MaToaNha
             WHERE h.[TrạngThaiHD] = 1 ${dateFilter} ORDER BY h.NgayLap DESC OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`,
            { type: sequelize.QueryTypes.SELECT, replacements }
        ).catch(() => []);
    }

    async countChiTietDoanhThu(tuNgay, denNgay) {
        let dateFilter = '';
        const replacements = {};
        if (tuNgay) { dateFilter += ' AND h.NgayLap >= :tuNgay'; replacements.tuNgay = tuNgay; }
        if (denNgay) { dateFilter += ' AND h.NgayLap <= :denNgay'; replacements.denNgay = denNgay; }

        const result = await sequelize.query(
            `SELECT COUNT(*) as total, SUM(ISNULL(h.GiaThoaThuan,0)) as tongTien
             FROM HopDong h WHERE h.[TrạngThaiHD] = 1 ${dateFilter}`,
            { type: sequelize.QueryTypes.SELECT, replacements }
        ).catch(() => [{ total: 0, tongTien: 0 }]);
        return result[0] || { total: 0, tongTien: 0 };
    }

    async getThongKeHopDong() {
        return await sequelize.query(
            `SELECT lhd.TenLoai AS TenLoaiHD, COUNT(h.MaHopDong) as tong,
                    SUM(CASE WHEN h.[TrạngThaiHD] = 1 THEN 1 ELSE 0 END) as daKy,
                    SUM(CASE WHEN h.[TrạngThaiHD] = 0 THEN 1 ELSE 0 END) as daHuy,
                    SUM(CASE WHEN h.[TrạngThaiHD] IS NULL THEN 1 ELSE 0 END) as dangXuLy
             FROM HopDong h INNER JOIN LoaiHopDong lhd ON h.MaLoaiHD = lhd.MaLoaiHD
             GROUP BY lhd.TenLoai ORDER BY tong DESC`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }

    async getThongKeCanHo() {
        return await sequelize.query(
            `SELECT tn.TenToaNha, t.TenTang, COUNT(c.MaCanHo) as tongCanHo,
                    SUM(CASE WHEN c.TTHienThi = 1 THEN 1 ELSE 0 END) as danhChoThue,
                    AVG(CAST(c.Gia AS FLOAT)) as giaTrungBinh, AVG(CAST(c.GiaThue AS FLOAT)) as giaThueGiaTrungBinh
             FROM ToaNha tn INNER JOIN Tang t ON tn.MaToaNha = t.MaToaNha INNER JOIN CanHo c ON t.MaTang = c.MaTang
             GROUP BY tn.TenToaNha, t.TenTang ORDER BY tn.TenToaNha, t.TenTang`,
            { type: sequelize.QueryTypes.SELECT }
        ).catch(() => []);
    }
}

module.exports = new ThongKeRepository();