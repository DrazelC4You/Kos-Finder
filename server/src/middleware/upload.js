import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import storage from '../services/storage.js';

/**
 * Middleware Upload Gambar (Section 25 & 29)
 * - Hanya menerima file gambar (validasi MIME type)
 * - Batas ukuran file 2MB per file
 * - Maksimal 8 file per request
 * - Nama file diacak untuk mencegah overwrite & path traversal
 */

const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_SIZE || 2 * 1024 * 1024); // 2MB
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, storage.getRoot()),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXT.includes(ext) ? ext : '.jpg';
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, `${Date.now()}-${unique}${safeExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    return cb(null, true);
  }
  cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau AVIF.'));
};

export const uploadImages = multer({
  storage: diskStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 8 }
});
