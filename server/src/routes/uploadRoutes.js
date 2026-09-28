import { Router } from 'express';
import { uploadImages } from '../middleware/upload.js';
import { uploadKosImages, deleteKosImage } from '../controllers/uploadController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { errorResponse } from '../utils/response.js';

const router = Router();

// Handler error multer (ukuran file, tipe file, dsb.)
const handleUploadError = (err, req, res, next) => {
  if (err) {
    const isMulter = err.name === 'MulterError';
    const message = isMulter && err.code === 'LIMIT_FILE_SIZE'
      ? 'Ukuran file terlalu besar. Maksimal 2MB per gambar.'
      : err.message || 'Gagal memproses unggahan.';
    return errorResponse(res, message, 400);
  }
  next();
};

// Hanya OWNER & ADMIN yang boleh mengelola gambar kos
router.post(
  '/',
  authenticate,
  authorize('OWNER', 'ADMIN'),
  (req, res, next) => uploadImages.array('images', 8)(req, res, (err) => handleUploadError(err, req, res, next)),
  uploadKosImages
);

router.delete('/', authenticate, authorize('OWNER', 'ADMIN'), deleteKosImage);

export default router;
