const repo = require('../repositories/quanLyLichRepository');

class QuanLyLichService {
    // --- LỊCH ---
    async getLichs(maKH) { return await repo.getLichsByKhach(maKH); }
    
    async createLich(maKH, dto) {
        const err = dto.validate();
        if (err) throw new Error(err);
        return await repo.createLich(maKH, dto);
    }

    async updateLich(maLich, maKH, dto) {
        const lich = await repo.findLichById(maLich, maKH);
        if (!lich) throw new Error('Không tìm thấy lịch hoặc không có quyền');
        return await lich.update(dto);
    }

    async deleteLich(maLich, maKH) {
        const deleted = await repo.deleteLich(maLich, maKH);
        if (!deleted) throw new Error('Không tìm thấy lịch để xóa');
        return true;
    }

    // --- SỰ KIỆN & HÓA ĐƠN (AGGREGATE) ---
    async getAggregatedEvents(maKH, dto) {
        const err = dto.validate();
        if (err) throw new Error(err);

        const targetMonthStart = new Date(dto.nam, dto.thang - 1, 1);
        const targetMonthEnd = new Date(dto.nam, dto.thang, 0, 23, 59, 59);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const mappedEvents = [];
        const lichs = await repo.getLichsByKhach(maKH);
        
        let maLichList = lichs.map(l => l.MaLich);
        if (dto.maLich) {
            maLichList = maLichList.filter(id => id === dto.maLich);
        }

        // 1. Sự kiện cá nhân
        if (maLichList.length > 0) {
            const events = await repo.getEvents(maLichList, targetMonthStart, targetMonthEnd);
            events.forEach(e => {
                mappedEvents.push({
                    id: 'evt_' + e.MaSuKien, originalId: e.MaSuKien, maLich: e.MaLich,
                    type: 'personal', title: e.TieuDe,
                    start: new Date(e.ThoiGianBatDau).toISOString(),
                    end: new Date(e.ThoiGIanKetThuc).toISOString(),
                    color: e.Lich?.MauSac || '#0061ff', location: e.DiaDiem || '', description: e.MoTa || ''
                });
            });
        }

        // 2. Hóa đơn (Chỉ lấy khi xem "Tất cả")
        if (!dto.maLich && maKH) {
            const hopDongs = await repo.getActiveHopDongs(maKH);
            const maCanHoList = hopDongs.map(h => h.MaCanHo);

            if (maCanHoList.length > 0) {
                const maTTPaid = await repo.getTrangThaiByName('Đã thanh toán');
                const maTTInProg = await repo.getTrangThaiByName('Đang thanh toán');

                // Dịch vụ
                const lockedDV = await repo.getLockedDichVuIds(maTTPaid, maTTInProg);
                const paidDVMap = await repo.getPaidAmountDV(lockedDV);
                const ctDVs = await repo.getCTDichVuByCanHo(maCanHoList);
                const dictDV = await repo.getAllDichVuDict();

                const groupedDV = {};
                ctDVs.forEach(ct => {
                    const paid = paidDVMap[`${ct.MaDV}_${ct.MaCanHo}_${ct.MaKy}`] || 0;
                    const conThieu = parseInt(ct.Gia) - paid;

                    if (conThieu > 0) {
                        let dueDate = ct.NgayDenHan ? new Date(ct.NgayDenHan) : null;
                        let isOverdue = false;
                        let displayDate = todayStart;

                        if (dueDate) {
                            if (isNaN(dueDate.getTime())) {
                                displayDate = todayStart;
                            } else {
                                dueDate.setHours(0, 0, 0, 0);
                                if (dueDate < todayStart) {
                                    isOverdue = true;
                                    displayDate = todayStart;
                                } else {
                                    displayDate = dueDate;
                                }
                            }
                        }

                        const groupKey = `${ct.MaDV}_${displayDate.getTime()}`;
                        if (!groupedDV[groupKey]) {
                            groupedDV[groupKey] = {
                                maDV: ct.MaDV, tenDV: dictDV[ct.MaDV]?.TenDV || 'Dịch vụ',
                                tongTien: 0, soKy: 0, isOverdue: isOverdue, displayDate: displayDate
                            };
                        }
                        groupedDV[groupKey].tongTien += conThieu;
                        groupedDV[groupKey].soKy += 1;
                        if (isOverdue) groupedDV[groupKey].isOverdue = true;
                    }
                });

                Object.values(groupedDV).forEach(g => {
                    if (g.displayDate >= targetMonthStart && g.displayDate <= targetMonthEnd) {
                        mappedEvents.push({
                            id: `dv_group_${g.maDV}_${g.displayDate.getTime()}`, type: 'dich-vu',
                            title: `${g.tenDV} (${g.soKy} kỳ)`,
                            start: g.displayDate.toISOString(), end: g.displayDate.toISOString(),
                            color: g.isOverdue ? '#ef4444' : '#f59e0b', isOverdue: g.isOverdue, amount: g.tongTien,
                            description: `Bạn có ${g.soKy} kỳ nợ chưa thanh toán.`,
                            url: `/hoa-don-dich-vu/thanh-toan?maDV=${g.maDV}`
                        });
                    }
                });

                // Hợp đồng
                const lockedHD = await repo.getLockedHopDongIds(maTTPaid, maTTInProg);
                const paidHDMap = await repo.getPaidAmountHD(lockedHD);
                const ctHDs = await repo.getCTThanhToanByCanHo(maCanHoList);
                const dictLoai = await repo.getAllLoaiTTHDDict();

                const groupedHD = {};
                ctHDs.forEach(ct => {
                    const paid = paidHDMap[`${ct.MaLoaiTT}_${ct.MaCanHo}_${ct.MaKyTT}`] || 0;
                    const conThieu = parseInt(ct.Gia) - paid;
                    
                    if (conThieu > 0) {
                        let dueDate = ct.NgayDenHan ? new Date(ct.NgayDenHan) : null;
                        let isOverdue = false;
                        let displayDate = todayStart;

                        if (dueDate) {
                            if (isNaN(dueDate.getTime())) displayDate = todayStart;
                            else {
                                dueDate.setHours(0, 0, 0, 0);
                                if (dueDate < todayStart) { isOverdue = true; displayDate = todayStart; }
                                else displayDate = dueDate;
                            }
                        }

                        const groupKey = `${ct.MaLoaiTT}_${displayDate.getTime()}`;
                        if (!groupedHD[groupKey]) {
                            groupedHD[groupKey] = {
                                maLoaiTT: ct.MaLoaiTT, tenLoaiTT: dictLoai[ct.MaLoaiTT]?.TenLoaiTT || 'Hợp đồng',
                                tongTien: 0, soKy: 0, isOverdue: isOverdue, displayDate: displayDate
                            };
                        }
                        groupedHD[groupKey].tongTien += conThieu;
                        groupedHD[groupKey].soKy += 1;
                        if (isOverdue) groupedHD[groupKey].isOverdue = true;
                    }
                });

                Object.values(groupedHD).forEach(g => {
                    if (g.displayDate >= targetMonthStart && g.displayDate <= targetMonthEnd) {
                        mappedEvents.push({
                            id: `hd_group_${g.maLoaiTT}_${g.displayDate.getTime()}`, type: 'hop-dong',
                            title: `${g.tenLoaiTT} (${g.soKy} khoản)`,
                            start: g.displayDate.toISOString(), end: g.displayDate.toISOString(),
                            color: g.isOverdue ? '#e11d48' : '#8b5cf6', isOverdue: g.isOverdue, amount: g.tongTien,
                            description: `Bạn có ${g.soKy} khoản chưa thanh toán.`,
                            url: `/hoa-don-hop-dong/thanh-toan?maLoaiTT=${g.maLoaiTT}`
                        });
                    }
                });
            }
        }
        return mappedEvents;
    }

    async createEvent(maKH, dto) {
        const err = dto.validate();
        if (err) throw new Error(err);
        
        const lich = await repo.findLichById(dto.MaLich, maKH);
        if (!lich) throw new Error('Lịch không tồn tại hoặc không thuộc quyền sở hữu');
        
        return await repo.createEvent(dto);
    }

    async updateEvent(maSuKien, maKH, dto) {
        const err = dto.validate();
        if (err) throw new Error(err);

        const suKien = await repo.findEventById(maSuKien, maKH);
        if (!suKien) throw new Error('Từ chối quyền truy cập');

        return await suKien.update(dto);
    }

    async deleteEvent(maSuKien, maKH) {
        const suKien = await repo.findEventById(maSuKien, maKH);
        if (!suKien) throw new Error('Từ chối quyền truy cập');
        await suKien.destroy();
        return true;
    }
}
module.exports = new QuanLyLichService();