// apps/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const createStorage = (folder) => multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../public/images/', folder);
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Chỉ chấp nhận file ảnh'), false);
};

const fileFilter = (req, file, cb) => cb(null, true);

const createUpload = (folder, filter = imageFilter) => multer({
  storage: createStorage(folder),
  fileFilter: filter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

exports.uploadCanHo        = createUpload('anhchinhcanho').single('UrlAnh');
exports.uploadDSACanHo     = createUpload('dsanhcanho').array('DSAUrls', 30);
exports.uploadBanner       = createUpload('banner').single('UrlAnh');
exports.uploadHopDong      = createUpload('anhhopdong').single('UrlAnhHD');
exports.uploadDSAHopDong   = createUpload('dsanhhopdong').array('DSAUrls', 30);
exports.uploadAvatar       = createUpload('avatars').single('AvatarUrl');
exports.uploadDichVu       = createUpload('dichvu').single('UrlIcon');
exports.uploadLoaiTTHD     = createUpload('loaitthd').single('UrlIcon');
exports.uploadNoiThat      = createUpload('noiThat').single('UrlAnh');
exports.uploadTrangThai    = createUpload('TrangThai').single('UrlAnh');
exports.uploadPhong        = createUpload('dsanhphong').array('PhongUrls', 30);
exports.uploadMinhChung    = createUpload('anhminhchung', fileFilter).single('urlAnh');
exports.uploadToaNha       = createUpload('AnhHeThong/ToaNha').single('UrlAnh');
