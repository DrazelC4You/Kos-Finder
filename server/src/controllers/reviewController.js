import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk mengelola Ulasan & Rating Kos
 */
export const reviewController = {
  /**
   * GET /api/reviews/kos/:kosId
   * Mendapatkan semua ulasan untuk kos tertentu
   */
  async getKosReviews(req, res, next) {
    try {
      const { kosId } = req.params;
      const data = await db.getReviewsByKosId(kosId);
      return successResponse(res, data, 'Daftar ulasan kos berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/reviews/kos/:kosId
   * Menambahkan rating dan ulasan dari penyewa
   */
  async createReview(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { kosId } = req.params;
      const { rating, comment } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return errorResponse(res, 'Rating wajib dipilih antara bintang 1 sampai 5.', 400);
      }
      if (!comment || !comment.trim()) {
        return errorResponse(res, 'Komentar ulasan tidak boleh kosong.', 400);
      }

      const review = await db.createReview({
        tenantId,
        kosId,
        rating: Number(rating),
        comment
      });

      return successResponse(res, review, 'Ulasan Anda berhasil dikirim! Terima kasih atas ulasannya.', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/reviews/:id
   * Memperbarui ulasan yang sudah pernah ditulis
   */
  async updateReview(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { id } = req.params;
      const { rating, comment } = req.body;

      const updated = await db.updateReview(id, tenantId, { rating, comment });
      return successResponse(res, updated, 'Ulasan berhasil diperbarui!');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memperbarui ulasan', 400);
    }
  },

  /**
   * DELETE /api/reviews/:id
   * Menghapus ulasan
   */
  async deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      await db.deleteReview(id, req.user.id, req.user.role);
      return successResponse(res, { id }, 'Ulasan berhasil dihapus');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal menghapus ulasan', 400);
    }
  },

  /**
   * POST /api/reviews/:id/reply
   * Memberikan balasan / respon resmi dari pemilik kos
   */
  async replyReview(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { id } = req.params;
      const { reply } = req.body;

      if (!reply || !reply.trim()) {
        return errorResponse(res, 'Tanggapan balasan ulasan tidak boleh kosong.', 400);
      }

      const updated = await db.replyReviewByOwner(id, ownerId, reply);
      return successResponse(res, updated, 'Balasan ulasan berhasil dikirim!');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal membalas ulasan', 400);
    }
  },

  /**
   * GET /api/reviews/owner
   * Mendapatkan semua ulasan yang masuk ke kos milik owner
   */
  async getOwnerReviews(req, res, next) {
    try {
      const ownerId = req.user.id;
      const reviews = await db.getReviewsByOwnerId(ownerId);
      return successResponse(res, reviews, 'Daftar ulasan kos milik Anda berhasil dimuat');
    } catch (err) {
      next(err);
    }
  }
};

export default reviewController;
