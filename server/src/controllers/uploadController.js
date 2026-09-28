import storage from '../services/storage.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * POST /api/uploads
 * Upload 1..8 gambar kos (khusus OWNER & ADMIN).
 * Field multipart: "images"
 * Response: daftar URL publik yang dapat disimpan ke field foto kos.
 */
export const uploadKosImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return errorResponse(res, 'Tidak ada file gambar yang diunggah.', 400);
    }

    const urls = req.files.map((f) => storage.toPublicUrl(f.filename));
    return successResponse(res, { urls }, `${urls.length} gambar berhasil diunggah.`, 201);
  } catch (err) {
    console.error('Upload error:', err);
    return errorResponse(res, 'Gagal mengunggah gambar.', 500);
  }
};

/**
 * DELETE /api/uploads
 * Menghapus file gambar berdasarkan URL publiknya.
 * Body: { url }
 */
export const deleteKosImage = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes('/uploads/')) {
      return errorResponse(res, 'URL gambar tidak valid.', 400);
    }
    const filename = url.split('/uploads/')[1];
    await storage.delete(filename);
    return successResponse(res, null, 'Gambar berhasil dihapus.');
  } catch (err) {
    console.error('Delete upload error:', err);
    return errorResponse(res, 'Gagal menghapus gambar.', 500);
  }
};
