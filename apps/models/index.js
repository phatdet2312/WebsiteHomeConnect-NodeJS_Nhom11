// apps/models/index.js
const sequelize = require('../config/database');

// ─── Import all models ────────────────────────────────────────────────────────
const ThongTinNguoiDung   = require('./ThongTinNguoiDung');
const KhachHang           = require('./KhachHang');
const NhanVien            = require('./NhanVien');
const VaiTroNhanVien      = require('./VaiTroNhanVien');   // PK: MaVTNV, col: ChucVu
const BannerQuangCao      = require('./BannerQuangCao');
const GmailThongBao       = require('./GmailThongBao');    // PK: MaTB, cols: MaLS, NoiDung, ThoiGianGui
const MaXacThuc           = require('./MaXacThuc');        // PK: Id, col: MaXacNhan, SoLanThu

const ToaNha              = require('./ToaNha');
const Tang                = require('./Tang');
const TTTTvaMucTT         = require('./TTTTvaMucTT');
const HienTrang           = require('./HienTrang');
const CanHo               = require('./CanHo');
const DSA_CanHo           = require('./DSA_CanHo');
const Phong               = require('./Phong');
const DSA_Phong           = require('./DSA_Phong');
const DanhMucNoiThat      = require('./DanhMucNoiThat');
const NoiThat             = require('./NoiThat');
const DSA_NoiThat         = require('./DSA_NoiThat');      // PK: MaAnh (STRING), +MaCanHo, MaHienTrang
const CT_NoiThat          = require('./CT_NoiThat');
const LoaiThietBi         = require('./LoaiThietBi');      // NEW
const CT_ThietBi          = require('./CT_ThietBi');       // NEW

const PTTT                = require('./PTTT');
const TrangThai           = require('./TrangThai');
const LoaiHopDong         = require('./LoaiHopDong');
const VaiTroHD            = require('./VaiTroHD');
const HopDong             = require('./HopDong');
const DSA_HopDong         = require('./DSA_HopDong');
const TBGmailHD           = require('./TBGmailHD');        // PK: MaTB, col: ThoiGianGui
const KyTT                = require('./KyTT');
const LoaiTTHD            = require('./LoaiTTHD');
const CT_ThanhToan        = require('./CT_ThanhToan');
const HD_HopDong          = require('./HD_HopDong');
const CT_HDHD             = require('./CT_HDHD');
const LS_TTHDHD           = require('./LS_TTHDHD');
const TB_GmailHDHD        = require('./TB_GmailHDHD');     // PK: MaTB, col: ThoiGianGui

const DichVu              = require('./DichVu');
const Ky                  = require('./Ky');
const CT_DichVu           = require('./CT_DichVu');
const HD_DichVu           = require('./HD_DichVu');
const CT_HDDV             = require('./CT_HDDV');
const LS_TTHDDV           = require('./LS_TTHDDV');
const TBGmailHDDV         = require('./TBGmailHDDV');      // PK: MaTB, col: ThoiGianGui

const LapChat             = require('./LapChat');          // NEW
const CT_LapChat          = require('./CT_LapChat');       // NEW — composite PK (MaLapChat, MaKH)
const TinNhan             = require('./TinNhan');          // NEW
const FileChat            = require('./FileChat');         // NEW
const LS_TaiFile          = require('./LS_TaiFile');       // NEW

const BanBe               = require('./BanBe');
const ChiSoSucKhoe        = require('./ChiSoSucKhoe');     // PK: MaSucKhoe, health metric cols
const TBGmailSucKhoe      = require('./TBGmailSucKhoe');   // PK: MaTB, col: MaSucKhoe, TrangThaiXemTB

const Lich                = require('./Lich');             // ThoiGian: DATE
const SuKien              = require('./SuKien');           // cols: TieuDe, ThoiGianBatDau, ThoiGIanKetThuc, DiaDiem
const NhacNhoThongBao     = require('./NhacNhoThongBao');  // tableName: NhacNhoThongBaoThong, col: ThoiGianNhac
const CT_NguoiThamGia     = require('./CT_NguoiThamGia'); // cols: VaiTroSuKien, ThoiGianThamGia
const TBGmailNhacNhoLich  = require('./TBGmailNhacNhoLich'); // col: MaSuKien, ThoiGianGui

// ─── ASSOCIATIONS ─────────────────────────────────────────────────────────────

// ── User → KhachHang (1-1, CASCADE) ──
ThongTinNguoiDung.hasOne(KhachHang, { foreignKey: 'UserId', onDelete: 'CASCADE' });
KhachHang.belongsTo(ThongTinNguoiDung, { foreignKey: 'UserId', as: 'User' });

// ── User → NhanVien (1-1, CASCADE) ──
ThongTinNguoiDung.hasOne(NhanVien, { foreignKey: 'UserId', onDelete: 'CASCADE' });
NhanVien.belongsTo(ThongTinNguoiDung, { foreignKey: 'UserId', as: 'User' });

// ── NhanVien → VaiTroNhanVien (1-N, CASCADE) ──
NhanVien.hasMany(VaiTroNhanVien, { foreignKey: 'MaNV', onDelete: 'CASCADE' });
VaiTroNhanVien.belongsTo(NhanVien, { foreignKey: 'MaNV' });

// ── ToaNha → Tang (1-N, CASCADE) ──
ToaNha.hasMany(Tang, { foreignKey: 'MaToaNha', onDelete: 'CASCADE' });
Tang.belongsTo(ToaNha, { foreignKey: 'MaToaNha' });

// ── Tang → CanHo (1-N, CASCADE) ──
Tang.hasMany(CanHo, { foreignKey: 'MaTang', onDelete: 'CASCADE' });
CanHo.belongsTo(Tang, { foreignKey: 'MaTang', as: 'Tang' });

// ── HienTrang → CanHo (1-N, SET NULL) ──
HienTrang.hasMany(CanHo, { foreignKey: 'MaHienTrang', onDelete: 'SET NULL' });
CanHo.belongsTo(HienTrang, { foreignKey: 'MaHienTrang', as: 'HienTrang' });

// ── TTTTvaMucTT → CanHo (1-N, NO ACTION) ──
TTTTvaMucTT.hasMany(CanHo, { foreignKey: 'MaMucTT' });
CanHo.belongsTo(TTTTvaMucTT, { foreignKey: 'MaMucTT', as: 'TTTTvaMucTT' });

// ── CanHo → DSA_CanHo (1-N, CASCADE) ──
CanHo.hasMany(DSA_CanHo, { foreignKey: 'MaCanHo', onDelete: 'CASCADE' });
DSA_CanHo.belongsTo(CanHo, { foreignKey: 'MaCanHo' });

// ── CanHo → Phong (1-N, CASCADE) ──
CanHo.hasMany(Phong, { foreignKey: 'MaCanHo', onDelete: 'CASCADE' });
Phong.belongsTo(CanHo, { foreignKey: 'MaCanHo' });

// ── Phong → DSA_Phong (1-N, CASCADE) ──
Phong.hasMany(DSA_Phong, { foreignKey: 'MaPhong', onDelete: 'CASCADE' });
DSA_Phong.belongsTo(Phong, { foreignKey: 'MaPhong' });

// ── DanhMucNoiThat → NoiThat (1-N, NO ACTION) ──
DanhMucNoiThat.hasMany(NoiThat, { foreignKey: 'MaDMNT' });
NoiThat.belongsTo(DanhMucNoiThat, { foreignKey: 'MaDMNT' });

// ── NoiThat → DSA_NoiThat (1-N, CASCADE) ──
NoiThat.hasMany(DSA_NoiThat, { foreignKey: 'MaNoiThat', onDelete: 'CASCADE' });
DSA_NoiThat.belongsTo(NoiThat, { foreignKey: 'MaNoiThat' });

// ── CT_NoiThat → DSA_NoiThat (1-N, CASCADE) via composite FK (constraints:false) ──
CT_NoiThat.hasMany(DSA_NoiThat, { foreignKey: 'MaCanHo', sourceKey: 'MaCanHo', constraints: false });

// ── CT_NoiThat associations (junction: NoiThat + CanHo + HienTrang) ──
CanHo.hasMany(CT_NoiThat, { foreignKey: 'MaCanHo' });
CT_NoiThat.belongsTo(CanHo, { foreignKey: 'MaCanHo' });
NoiThat.hasMany(CT_NoiThat, { foreignKey: 'MaNoiThat' });
CT_NoiThat.belongsTo(NoiThat, { foreignKey: 'MaNoiThat' });
HienTrang.hasMany(CT_NoiThat, { foreignKey: 'MaHienTrang' });
CT_NoiThat.belongsTo(HienTrang, { foreignKey: 'MaHienTrang', as: 'HienTrangCT' });

// ── LoaiThietBi → CT_ThietBi (1-N, NO ACTION) ──
LoaiThietBi.hasMany(CT_ThietBi, { foreignKey: 'MaLoaiTB' });
CT_ThietBi.belongsTo(LoaiThietBi, { foreignKey: 'MaLoaiTB' });

// ── Phong → CT_ThietBi (1-N, nullable) ──
Phong.hasMany(CT_ThietBi, { foreignKey: 'MaPhong' });
CT_ThietBi.belongsTo(Phong, { foreignKey: 'MaPhong' });

// ── KhachHang → HopDong (1-N, CASCADE) ──
KhachHang.hasMany(HopDong, { foreignKey: 'MaKH', onDelete: 'CASCADE' });
HopDong.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'KhachHang' });

// ── CanHo → HopDong (1-N, NO ACTION) ──
CanHo.hasMany(HopDong, { foreignKey: 'MaCanHo' });
HopDong.belongsTo(CanHo, { foreignKey: 'MaCanHo', as: 'CanHo' });

// ── LoaiHopDong → HopDong (1-N, NO ACTION) ──
LoaiHopDong.hasMany(HopDong, { foreignKey: 'MaLoaiHD' });
HopDong.belongsTo(LoaiHopDong, { foreignKey: 'MaLoaiHD', as: 'LoaiHopDong' });

// ── VaiTroHD → HopDong (1-N, NO ACTION) ──
VaiTroHD.hasMany(HopDong, { foreignKey: 'MaVaiTroHD' });
HopDong.belongsTo(VaiTroHD, { foreignKey: 'MaVaiTroHD', as: 'VaiTroHD' });

// ── NhanVien → HopDong (1-N, NO ACTION) ──
NhanVien.hasMany(HopDong, { foreignKey: 'MaNV' });
HopDong.belongsTo(NhanVien, { foreignKey: 'MaNV', as: 'NhanVien' });

// ── HopDong → DSA_HopDong (1-N, CASCADE) ──
HopDong.hasMany(DSA_HopDong, { foreignKey: 'MaHopDong', onDelete: 'CASCADE' });
DSA_HopDong.belongsTo(HopDong, { foreignKey: 'MaHopDong' });

// ── HopDong → TBGmailHD (1-N, CASCADE) ──
HopDong.hasMany(TBGmailHD, { foreignKey: 'MaHopDong', onDelete: 'CASCADE' });
TBGmailHD.belongsTo(HopDong, { foreignKey: 'MaHopDong' });

// ── HopDong → HD_HopDong (1-N, SET NULL) ──
HopDong.hasMany(HD_HopDong, { foreignKey: 'MaHopDong', onDelete: 'SET NULL' });
HD_HopDong.belongsTo(HopDong, { foreignKey: 'MaHopDong', as: 'HopDong' });

// ── PTTT → HD_HopDong (1-N, SET NULL) ──
PTTT.hasMany(HD_HopDong, { foreignKey: 'MaPT', onDelete: 'SET NULL' });
HD_HopDong.belongsTo(PTTT, { foreignKey: 'MaPT', as: 'PTTT' });

// ── HD_HopDong → LS_TTHDHD (1-N, CASCADE) ──
HD_HopDong.hasMany(LS_TTHDHD, { foreignKey: 'MaHDHD', onDelete: 'CASCADE' });
LS_TTHDHD.belongsTo(HD_HopDong, { foreignKey: 'MaHDHD' });

// ── TrangThai → LS_TTHDHD (1-N, SET NULL) ──
TrangThai.hasMany(LS_TTHDHD, { foreignKey: 'MaTT', onDelete: 'SET NULL' });
LS_TTHDHD.belongsTo(TrangThai, { foreignKey: 'MaTT', as: 'TrangThai' });

// ── LS_TTHDHD → TB_GmailHDHD (1-N) ──
LS_TTHDHD.hasMany(TB_GmailHDHD, { foreignKey: 'MaLS' });
TB_GmailHDHD.belongsTo(LS_TTHDHD, { foreignKey: 'MaLS' });

// ── HD_HopDong → CT_HDHD (1-N, CASCADE) ──
HD_HopDong.hasMany(CT_HDHD, { foreignKey: 'MaHDHD', onDelete: 'CASCADE' });
CT_HDHD.belongsTo(HD_HopDong, { foreignKey: 'MaHDHD' });

// ── CT_ThanhToan associations ──
LoaiTTHD.hasMany(CT_ThanhToan, { foreignKey: 'MaLoaiTT' });
CT_ThanhToan.belongsTo(LoaiTTHD, { foreignKey: 'MaLoaiTT' });
CanHo.hasMany(CT_ThanhToan, { foreignKey: 'MaCanHo' });
CT_ThanhToan.belongsTo(CanHo, { foreignKey: 'MaCanHo', as: 'CanHoTT' });
KyTT.hasMany(CT_ThanhToan, { foreignKey: 'MaKyTT' });
CT_ThanhToan.belongsTo(KyTT, { foreignKey: 'MaKyTT' });

// ── CT_HDHD → CT_ThanhToan (composite FK, constraints:false) ──
CT_HDHD.belongsTo(CT_ThanhToan, { foreignKey: 'MaLoaiTT', targetKey: 'MaLoaiTT', as: 'CT_ThanhToan_LoaiTT', constraints: false });
CT_ThanhToan.hasMany(CT_HDHD, { foreignKey: 'MaLoaiTT', sourceKey: 'MaLoaiTT', constraints: false });

// ── DichVu → CT_DichVu ──
DichVu.hasMany(CT_DichVu, { foreignKey: 'MaDV' });
CT_DichVu.belongsTo(DichVu, { foreignKey: 'MaDV', as: 'DichVu' });

// ── CanHo → CT_DichVu ──
CanHo.hasMany(CT_DichVu, { foreignKey: 'MaCanHo' });
CT_DichVu.belongsTo(CanHo, { foreignKey: 'MaCanHo', as: 'CanHo' });

// ── Ky → CT_DichVu ──
Ky.hasMany(CT_DichVu, { foreignKey: 'MaKy' });
CT_DichVu.belongsTo(Ky, { foreignKey: 'MaKy', as: 'Ky' });

// ── KhachHang → HD_DichVu (1-N, CASCADE) ──
KhachHang.hasMany(HD_DichVu, { foreignKey: 'MaKH', onDelete: 'CASCADE' });
HD_DichVu.belongsTo(KhachHang, { foreignKey: 'MaKH' });

// ── PTTT → HD_DichVu (1-N, NO ACTION) ──
PTTT.hasMany(HD_DichVu, { foreignKey: 'MaPT' });
HD_DichVu.belongsTo(PTTT, { foreignKey: 'MaPT', as: 'PTTT' });

// ── HD_DichVu → CT_HDDV (1-N, CASCADE) ──
HD_DichVu.hasMany(CT_HDDV, { foreignKey: 'MaHDDV', onDelete: 'CASCADE' });
CT_HDDV.belongsTo(HD_DichVu, { foreignKey: 'MaHDDV' });

// ── CT_HDDV → CT_DichVu (composite FK, constraints:false) ──
CT_HDDV.belongsTo(CT_DichVu, { foreignKey: 'MaDV', targetKey: 'MaDV', as: 'CT_DichVu', constraints: false });
CT_DichVu.hasMany(CT_HDDV, { foreignKey: 'MaDV', sourceKey: 'MaDV', constraints: false });

// ── HD_DichVu → LS_TTHDDV (1-N, CASCADE) ──
HD_DichVu.hasMany(LS_TTHDDV, { foreignKey: 'MaHDDV', onDelete: 'CASCADE' });
LS_TTHDDV.belongsTo(HD_DichVu, { foreignKey: 'MaHDDV' });

// ── TrangThai → LS_TTHDDV (1-N, SET NULL) ──
TrangThai.hasMany(LS_TTHDDV, { foreignKey: 'MaTT', onDelete: 'SET NULL' });
LS_TTHDDV.belongsTo(TrangThai, { foreignKey: 'MaTT', as: 'TrangThai' });

// ── LS_TTHDDV → TBGmailHDDV (1-N) ──
LS_TTHDDV.hasMany(TBGmailHDDV, { foreignKey: 'MaLS' });
TBGmailHDDV.belongsTo(LS_TTHDDV, { foreignKey: 'MaLS' });

// ── BanBe (self-referential via KhachHang, NO ACTION) ──
KhachHang.hasMany(BanBe, { foreignKey: 'MaKHGui', as: 'BanBeGui' });
KhachHang.hasMany(BanBe, { foreignKey: 'MaKHNhan', as: 'BanBeNhan' });
BanBe.belongsTo(KhachHang, { foreignKey: 'MaKHGui', as: 'KhachHangGui' });
BanBe.belongsTo(KhachHang, { foreignKey: 'MaKHNhan', as: 'KhachHangNhan' });

// ── KhachHang → ChiSoSucKhoe (1-N, CASCADE) ──
KhachHang.hasMany(ChiSoSucKhoe, { foreignKey: 'MaKH', onDelete: 'CASCADE' });
ChiSoSucKhoe.belongsTo(KhachHang, { foreignKey: 'MaKH' });

// ── ChiSoSucKhoe → TBGmailSucKhoe (1-N, CASCADE) ──
ChiSoSucKhoe.hasMany(TBGmailSucKhoe, { foreignKey: 'MaSucKhoe', onDelete: 'CASCADE' });
TBGmailSucKhoe.belongsTo(ChiSoSucKhoe, { foreignKey: 'MaSucKhoe' });

// ── KhachHang → LapChat (1-N, SET NULL) ──
KhachHang.hasMany(LapChat, { foreignKey: 'MaKH', onDelete: 'SET NULL' });
LapChat.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'KhachHang' });

// ── NhanVien → LapChat (1-N, SET NULL) ──
NhanVien.hasMany(LapChat, { foreignKey: 'MaNV', onDelete: 'SET NULL' });
LapChat.belongsTo(NhanVien, { foreignKey: 'MaNV', as: 'NhanVien' });

// ── LapChat → CT_LapChat (1-N, CASCADE) — composite PK (MaLapChat, MaKH) ──
LapChat.hasMany(CT_LapChat, { foreignKey: 'MaLapChat', onDelete: 'CASCADE' });
CT_LapChat.belongsTo(LapChat, { foreignKey: 'MaLapChat' });

// ── KhachHang → CT_LapChat (1-N, NO ACTION) ──
KhachHang.hasMany(CT_LapChat, { foreignKey: 'MaKH' });
CT_LapChat.belongsTo(KhachHang, { foreignKey: 'MaKH' });

// ── CT_LapChat → TinNhan (via composite FK MaLapChat+MaKH, constraints:false) ──
CT_LapChat.hasMany(TinNhan, { foreignKey: 'MaLapChat', sourceKey: 'MaLapChat', constraints: false });
TinNhan.belongsTo(CT_LapChat, { foreignKey: 'MaLapChat', targetKey: 'MaLapChat', constraints: false });

// ── TinNhan → FileChat (1-N, CASCADE) ──
TinNhan.hasMany(FileChat, { foreignKey: 'MaTin', onDelete: 'CASCADE' });
FileChat.belongsTo(TinNhan, { foreignKey: 'MaTin' });

// ── FileChat → LS_TaiFile (1-N) ──
FileChat.hasMany(LS_TaiFile, { foreignKey: 'MaFile' });
LS_TaiFile.belongsTo(FileChat, { foreignKey: 'MaFile' });

// ── CT_LapChat → LS_TaiFile (via composite FK, constraints:false) ──
CT_LapChat.hasMany(LS_TaiFile, { foreignKey: 'MaLapChat', sourceKey: 'MaLapChat', constraints: false });
LS_TaiFile.belongsTo(CT_LapChat, { foreignKey: 'MaLapChat', targetKey: 'MaLapChat', constraints: false, as: 'CT_LapChat' });

// ── KhachHang → Lich (1-N, CASCADE) ──
KhachHang.hasMany(Lich, { foreignKey: 'MaKH', onDelete: 'CASCADE' });
Lich.belongsTo(KhachHang, { foreignKey: 'MaKH' });

// ── Lich → SuKien (1-N, CASCADE) ──
Lich.hasMany(SuKien, { foreignKey: 'MaLich', onDelete: 'CASCADE' });
SuKien.belongsTo(Lich, { foreignKey: 'MaLich' });

// ── SuKien → CT_NguoiThamGia (1-N, CASCADE) ──
SuKien.hasMany(CT_NguoiThamGia, { foreignKey: 'MaSuKien', onDelete: 'CASCADE' });
CT_NguoiThamGia.belongsTo(SuKien, { foreignKey: 'MaSuKien' });

// ── KhachHang → CT_NguoiThamGia (NO ACTION) ──
KhachHang.hasMany(CT_NguoiThamGia, { foreignKey: 'MaKH' });
CT_NguoiThamGia.belongsTo(KhachHang, { foreignKey: 'MaKH', as: 'KhachHangThamGia' });

// ── SuKien → NhacNhoThongBao (1-N, CASCADE) ──
SuKien.hasMany(NhacNhoThongBao, { foreignKey: 'MaSuKien', onDelete: 'CASCADE' });
NhacNhoThongBao.belongsTo(SuKien, { foreignKey: 'MaSuKien' });

// ── SuKien → TBGmailNhacNhoLich (1-N) ──
SuKien.hasMany(TBGmailNhacNhoLich, { foreignKey: 'MaSuKien' });
TBGmailNhacNhoLich.belongsTo(SuKien, { foreignKey: 'MaSuKien' });

// ─── Export ────────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  ThongTinNguoiDung,
  KhachHang,
  NhanVien,
  VaiTroNhanVien,
  BannerQuangCao,
  GmailThongBao,
  MaXacThuc,
  ToaNha,
  Tang,
  TTTTvaMucTT,
  HienTrang,
  CanHo,
  DSA_CanHo,
  Phong,
  DSA_Phong,
  DanhMucNoiThat,
  NoiThat,
  DSA_NoiThat,
  CT_NoiThat,
  LoaiThietBi,
  CT_ThietBi,
  PTTT,
  TrangThai,
  LoaiHopDong,
  VaiTroHD,
  HopDong,
  DSA_HopDong,
  TBGmailHD,
  KyTT,
  LoaiTTHD,
  CT_ThanhToan,
  HD_HopDong,
  CT_HDHD,
  LS_TTHDHD,
  TB_GmailHDHD,
  DichVu,
  Ky,
  CT_DichVu,
  HD_DichVu,
  CT_HDDV,
  LS_TTHDDV,
  TBGmailHDDV,
  LapChat,
  CT_LapChat,
  TinNhan,
  FileChat,
  LS_TaiFile,
  BanBe,
  ChiSoSucKhoe,
  TBGmailSucKhoe,
  Lich,
  SuKien,
  NhacNhoThongBao,
  CT_NguoiThamGia,
  TBGmailNhacNhoLich,
};
