import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk mengelola Dashboard & Fitur Pencari Kos (Tenant)
 */
export const tenantController = {
  /**
   * GET /api/tenant/dashboard
   * Mendapatkan statistik ringkasan dashboard tenant
   */
  async getDashboard(req, res, next) {
    try {
      const tenantId = req.user.id;
      const stats = await db.getTenantDashboardStats(tenantId);
      const bookings = await db.getBookingsByTenantId(tenantId);
      const favorites = await db.getFavoritesByUserId(tenantId);

      return successResponse(res, {
        stats,
        recentBookings: bookings.slice(0, 5),
        favorites: favorites.slice(0, 4)
      }, 'Data dashboard tenant berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/tenant/bookings
   * Mendapatkan daftar semua booking milik tenant
   */
  async getBookings(req, res, next) {
    try {
      const tenantId = req.user.id;
      const bookings = await db.getBookingsByTenantId(tenantId);
      return successResponse(res, bookings, 'Daftar booking berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/tenant/bookings
   * Membuat pengajuan booking kos baru
   */
  async createBooking(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { kosId, roomId, tanggalMulai, durasiBulan, totalHarga, catatan } = req.body;

      if (!kosId) {
        return errorResponse(res, 'ID Kos wajib disertakan', 400);
      }

      const booking = await db.createBooking({
        tenantId,
        kosId,
        roomId,
        tanggalMulai: tanggalMulai || new Date(),
        durasiBulan: durasiBulan || 1,
        totalHarga,
        catatan
      });

      return successResponse(res, booking, 'Pengajuan sewa kos berhasil dikirim ke pemilik!', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal membuat pengajuan booking.', 400);
    }
  },

  /**
   * PUT /api/tenant/bookings/:id/cancel
   * Membatalkan pengajuan booking (hanya jika status PENDING)
   */
  async cancelBooking(req, res, next) {
    try {
      const tenantId = req.user.id;
      const bookingId = req.params.id;

      const updated = await db.cancelBooking(bookingId, tenantId);
      return successResponse(res, updated, 'Pengajuan booking berhasil dibatalkan');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal membatalkan booking', 400);
    }
  },

  /**
   * GET /api/tenant/favorites
   * Mendapatkan daftar kos favorit tenant
   */
  async getFavorites(req, res, next) {
    try {
      const tenantId = req.user.id;
      const favorites = await db.getFavoritesByUserId(tenantId);
      return successResponse(res, favorites, 'Daftar kos favorit berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/tenant/favorites/:kosId
   * Menambahkan kos ke daftar favorit
   */
  async addFavorite(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { kosId } = req.params;

      const result = await db.addFavorite(tenantId, kosId);
      return successResponse(res, result, 'Kos berhasil ditambahkan ke favorit', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/tenant/favorites/:kosId
   * Menghapus kos dari daftar favorit
   */
  async removeFavorite(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { kosId } = req.params;

      await db.removeFavorite(tenantId, kosId);
      return successResponse(res, { kosId }, 'Kos berhasil dihapus dari favorit');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/tenant/profile
   * Mengupdate data profil tenant
   */
  async updateProfile(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { name, phone, avatar, bio, gender, address, occupation, emergencyContact } = req.body;

      const updatedUser = await db.updateUserProfile(tenantId, {
        name,
        phone,
        avatar,
        bio,
        gender,
        address,
        occupation,
        emergencyContact
      });

      // Sanitasi password sebelum return
      const { password, ...safeUser } = updatedUser;
      return successResponse(res, safeUser, 'Profil berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/tenant/bookings/:id/extend
   * Mengajukan perpanjangan masa sewa kos
   */
  async requestExtension(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { id } = req.params;
      const { durasiBulan, catatan } = req.body;

      if (!durasiBulan || Number(durasiBulan) <= 0) {
        return errorResponse(res, 'Durasi perpanjangan bulan harus lebih dari 0.', 400);
      }

      const updated = await db.requestBookingExtension(id, tenantId, Number(durasiBulan), catatan);
      return successResponse(res, updated, 'Pengajuan perpanjangan sewa berhasil dikirim ke pemilik kos!');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal mengajukan perpanjangan sewa.', 400);
    }
  },

  /**
   * GET /api/tenant/rentals/expiring
   * Mendapatkan daftar sewa yang akan segera berakhir
   */
  async getExpiringRentals(req, res, next) {
    try {
      const tenantId = req.user.id;
      const expiring = await db.getExpiringRentals(tenantId, 'TENANT');
      return successResponse(res, expiring, 'Daftar sewa aktif & masa tenggang berhasil dimuat.');
    } catch (err) {
      next(err);
    }
  }
};

export default tenantController;

