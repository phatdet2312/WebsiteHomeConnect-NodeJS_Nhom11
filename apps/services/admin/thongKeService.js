const repo = require('../../repositories/admin/thongKeRepository');

class ThongKeService {
    async getTongQuanDashboard() {
        const [counts, doanhThuTheoThang, topCanHo, doanhThuToaNha, tyLeCanHo, khachHangMoi, thuNhapDichVu] = await Promise.all([
            repo.getBasicCounts(),
            repo.getDoanhThuTheoThang(),
            repo.getTopCanHo(),
            repo.getDoanhThuToaNha(),
            repo.getTyLeCanHo(),
            repo.getKhachHangMoi(),
            repo.getThuNhapDichVu()
        ]);

        return {
            stats: { 
                tongKH: counts[0], tongCanHo: counts[1], 
                tongHDDangKy: counts[2], tongHDDaKy: counts[3], tongHDHuy: counts[4] 
            },
            doanhThuTheoThang, topCanHo, doanhThuToaNha, tyLeCanHo, khachHangMoi, thuNhapDichVu
        };
    }

    async getBaoCaoDoanhThu(dto) {
        const [items, totals] = await Promise.all([
            repo.getChiTietDoanhThu(dto.tuNgay, dto.denNgay, dto.limit, dto.offset),
            repo.countChiTietDoanhThu(dto.tuNgay, dto.denNgay)
        ]);

        const total = parseInt(totals.total) || 0;
        return {
            items,
            total,
            tongTien: totals.tongTien || 0,
            totalPages: Math.ceil(total / dto.limit)
        };
    }

    async getThongKeHopDong() {
        return await repo.getThongKeHopDong();
    }

    async getThongKeCanHo() {
        return await repo.getThongKeCanHo();
    }
}

module.exports = new ThongKeService();