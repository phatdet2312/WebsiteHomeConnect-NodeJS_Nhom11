const repo = require('../../repositories/admin/quanLyNguoiDungRepository');

class QuanLyNguoiDungService {
    _tinhSoTuKhop(user, tuKhoaArray) {
        let diem = 0;
        const email = ` ${(user.Email || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
        const hoTen = ` ${(user.HoTen || '').toLowerCase()} `.split(/\s+/).filter(Boolean);
        for (const tu of tuKhoaArray) {
            if (email.includes(tu)) diem += 2;
            else if (hoTen.includes(tu)) diem += 1;
        }
        return diem;
    }
    _tinhSoKyTuKhop(user, tuKhoa) {
        let diem = 0;
        const email = (user.Email || '').toLowerCase();
        const hoTen = (user.HoTen || '').toLowerCase();
        const parts = tuKhoa.split(/\s+/).filter(Boolean);
        for (const tu of parts) {
            if (email.includes(tu)) diem += tu.length * 2;
            else if (hoTen.includes(tu)) diem += tu.length;
        }
        return diem;
    }

    async getList(query) {
        const { search='', trangThai='active', hoatDong='tatCa', page=1, limit=15 } = query;
        let usersRaw = await repo.getAllUsers();
        let users = usersRaw.map(u => u.toJSON());
        const now = new Date();

        const stats = {
            total: users.length,
            active: users.filter(u => !u.LockoutEnd || new Date(u.LockoutEnd) <= now).length,
            locked: users.filter(u => u.LockoutEnd && new Date(u.LockoutEnd) > now).length,
            online: users.filter(u => u.TrangThaiHoatDong === true).length
        };

        if (trangThai === 'locked') users = users.filter(u => u.LockoutEnd && new Date(u.LockoutEnd) > now);
        else if (trangThai === 'active') users = users.filter(u => !u.LockoutEnd || new Date(u.LockoutEnd) <= now);

        if (hoatDong === 'online') users = users.filter(u => u.TrangThaiHoatDong === true);
        else if (hoatDong === 'offline') users = users.filter(u => !u.TrangThaiHoatDong);

        let ketQuaTimKiem = null, suggestions = [];
        if (search) {
            if (search.includes(',')) {
                const ids = search.split(',').map(s => s.trim()).filter(Boolean);
                const found = users.filter(u => ids.includes(u.Id));
                if (found.length > 0) users = found;
                else { ketQuaTimKiem = 'Không tìm thấy người dùng với ID đã nhập.'; suggestions = users.slice(0, 3); users = []; }
            } else {
                const tuKhoaArray = search.toLowerCase().split(/\s+/).filter(Boolean);
                const scored = users.map(u => ({ u, diem: this._tinhSoTuKhop(u, tuKhoaArray) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem);
                if (scored.length > 0) users = scored.map(x => x.u);
                else { ketQuaTimKiem = 'Không có người dùng liên quan.'; suggestions = users.slice(0, 3); users = []; }
            }
        }

        return { data: users.slice((page - 1) * limit, page * limit), stats, totalItems: users.length, totalPages: Math.ceil(users.length / limit), currentPage: parseInt(page), message: ketQuaTimKiem, suggestions };
    }

    async getSuggestions(term) {
        if (!term) return [];
        const users = await repo.getBaseUsers();
        const scored = users.map(u => ({ u: u.toJSON(), diem: this._tinhSoKyTuKhop(u, term) })).filter(x => x.diem > 0).sort((a, b) => b.diem - a.diem).slice(0, 5);
        return scored.map(x => x.u);
    }

    async getDetail(id) {
        const user = await repo.getUserById(id);
        if (!user) return null;
        const allRoles = ['Admin', 'Manager', 'Staff', 'Accountant', 'Support'];
        const currentRoles = user.NhanVien ? user.NhanVien.VaiTroNhanViens.map(v => v.ChucVu) : [];
        return { ...user.toJSON(), AllRoles: allRoles, CurrentRoles: currentRoles };
    }

    async toggleLock(id, isLocked) {
        const user = await repo.getUserById(id);
        if (!user) throw new Error('Người dùng không tồn tại.');
        if (user.IsSuperAdmin && isLocked) throw new Error('Không thể khóa tài khoản Super Admin.');
        await user.update({ LockoutEnd: isLocked ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) : null });
    }

    async updateRoles(userId, roles) {
        const user = await repo.getUserById(userId);
        if (!user) throw new Error('Không tìm thấy người dùng');

        let nhanVien = await repo.getNhanVienByUserId(userId);
        const selectedRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

        if (selectedRoles.length > 0) {
            if (!nhanVien) nhanVien = await repo.createNhanVien({ UserId: userId, TenNV: user.HoTen || user.UserName, EmailNV: user.Email });
            await repo.deleteVaiTroByMaNV(nhanVien.MaNV);
            for (const r of selectedRoles) await repo.createVaiTro({ MaNV: nhanVien.MaNV, ChucVu: r.trim() });
        } else {
            if (nhanVien) {
                await repo.deleteVaiTroByMaNV(nhanVien.MaNV);
                await nhanVien.destroy();
            }
        }
    }

    async processBulkAction(ids, action) {
        for (const id of ids) {
            const u = await repo.getUserById(id);
            if (u && !u.IsSuperAdmin) {
                if (action === 'delete') await u.destroy();
                else if (action === 'lock') await u.update({ LockoutEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) });
            }
        }
    }
}
module.exports = new QuanLyNguoiDungService();