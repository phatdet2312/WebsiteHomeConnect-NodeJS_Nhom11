const repo = require('../repositories/canHoKhachHangRepository');

class CanHoKhachHangService {
    async getMyContracts(maKH) { return await repo.getMyContracts(maKH); }
    async getContractDetail(maHopDong, maKH) { return await repo.getContractDetail(maHopDong, maKH); }
}
module.exports = new CanHoKhachHangService();