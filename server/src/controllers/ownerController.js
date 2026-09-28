import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk mengelola fitur Pemilik Kos (Owner)
 */
export const ownerController = {
  /**
   * GET /api/owner/dashboard
   * Ringkasan statistik & data properti kos milik owner
   */
  async getDashboard(req, res, next) {
    try {
      const ownerId = req.user.id;
      const stats = await db.getOwnerDashboardStats(ownerId);
      const kosList = await db.getKosByOwnerId(ownerId);
      const bookings = await db.getBookingsByOwnerId(ownerId);

      return successResponse(res, {
        stats,
        kos: kosList,
        recentBookings: bookings.slice(0, 5)
      }, 'Data dashboard pemilik berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/owner/kos
   * Mendapatkan daftar semua kos milik owner
   */
  async getKosList(req, res, next) {
    try {
      const ownerId = req.user.id;
      const list = await db.getKosByOwnerId(ownerId);
      return successResponse(res, list, 'Daftar properti kos berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/owner/kos
   * Menambahkan listing kos baru
   */
  async createKos(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { nama, deskripsi, alamat, kota, hargaBulanan, type, foto, fasilitas, aturan, totalKamar } = req.body;

      if (!nama || !alamat || !kota || !hargaBulanan) {
        return errorResponse(res, 'Nama kos, alamat, kota, dan harga bulanan wajib diisi.', 400);
      }

      const newKos = await db.createKos({
        ownerId,
        nama: nama.trim(),
        deskripsi: deskripsi ? deskripsi.trim() : '',
        alamat: alamat.trim(),
        kota: kota.trim(),
        hargaBulanan: Number(hargaBulanan),
        type: type ? type.toUpperCase() : 'CAMPUR',
        foto: Array.isArray(foto) && foto.length > 0 ? foto : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60'
        ],
        fasilitas: Array.isArray(fasilitas) ? fasilitas : ['WiFi', 'Kasur', 'Lemari'],
        aturan: aturan || 'Harap menjaga ketertiban bersama.',
        totalKamar: Number(totalKamar) || 4,
        status: 'PENDING'
      });

      return successResponse(res, newKos, 'Listing kos baru berhasil didaftarkan!', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/owner/kos/:id
   * Memperbarui informasi kos
   */
  async updateKos(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { id } = req.params;

      const existing = await db.getKosById(id);
      if (!existing) {
        return errorResponse(res, 'Properti kos tidak ditemukan.', 404);
      }

      if (existing.ownerId !== ownerId && req.user.role !== 'ADMIN') {
        return errorResponse(res, 'Akses ditolak. Anda bukan pemilik properti kos ini.', 403);
      }

      const updated = await db.updateKos(id, req.body);
      return successResponse(res, updated, 'Informasi kos berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/owner/kos/:id
   * Menghapus listing kos
   */
  async deleteKos(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { id } = req.params;

      const existing = await db.getKosById(id);
      if (!existing) {
        return errorResponse(res, 'Properti kos tidak ditemukan.', 404);
      }

      if (existing.ownerId !== ownerId && req.user.role !== 'ADMIN') {
        return errorResponse(res, 'Akses ditolak. Anda bukan pemilik properti kos ini.', 403);
      }

      await db.deleteKos(id);
      return successResponse(res, { id }, 'Listing kos berhasil dihapus');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/owner/kos/:kosId/rooms
   * Menambahkan kamar baru ke unit kos
   */
  async addRoom(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { kosId } = req.params;
      const { nomorKamar, harga, status } = req.body;

      const newRoom = await db.addRoomToKos(kosId, ownerId, {
        nomorKamar,
        harga,
        status: status || 'AVAILABLE'
      });

      return successResponse(res, newRoom, 'Kamar baru berhasil ditambahkan!', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal menambahkan kamar', 400);
    }
  },

  /**
   * PUT /api/owner/rooms/:roomId
   * Memperbarui status / nomor kamar
   */
  async updateRoom(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { roomId } = req.params;

      const updated = await db.updateRoom(roomId, ownerId, req.body);
      return successResponse(res, updated, 'Data kamar berhasil diperbarui');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memperbarui kamar', 400);
    }
  },

  /**
   * DELETE /api/owner/rooms/:roomId
   * Menghapus kamar dari unit kos
   */
  async deleteRoom(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { roomId } = req.params;

      await db.deleteRoom(roomId, ownerId);
      return successResponse(res, { roomId }, 'Kamar berhasil dihapus');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal menghapus kamar', 400);
    }
  },

  /**
   * GET /api/owner/bookings
   * Mendapatkan semua permintaan sewa / booking masuk ke kos milik owner
   */
  async getBookings(req, res, next) {
    try {
      const ownerId = req.user.id;
      const bookings = await db.getBookingsByOwnerId(ownerId);
      return successResponse(res, bookings, 'Daftar booking masuk berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/owner/bookings/:id/status
   * Menyetujui (APPROVED) atau Menolak (REJECTED) booking
   */
  async updateBookingStatus(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { id } = req.params;
      const { status } = req.body;

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return errorResponse(res, 'Status harus berupa APPROVED atau REJECTED', 400);
      }

      const updated = await db.updateBookingStatusByOwner(id, ownerId, status);
      const actionText = status === 'APPROVED' ? 'disetujui' : 'ditolak';
      return successResponse(res, updated, `Pengajuan booking berhasil ${actionText}!`);
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal mengubah status booking', 400);
    }
  },

  /**
   * PUT /api/owner/bookings/:id/extend
   * Menyetujui (APPROVE) atau Menolak (REJECT) perpanjangan sewa
   */
  async processExtension(req, res, next) {
    try {
      const ownerId = req.user.id;
      const { id } = req.params;
      const { action, alasanPenolakan } = req.body;

      if (!['APPROVE', 'REJECT'].includes(action)) {
        return errorResponse(res, 'Action harus APPROVE atau REJECT.', 400);
      }

      const result = await db.processExtensionApproval(id, ownerId, action, alasanPenolakan);
      const actionText = action === 'APPROVE' ? 'disetujui' : 'ditolak';
      return successResponse(res, result, `Pengajuan perpanjangan sewa berhasil ${actionText}!`);
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memproses perpanjangan sewa.', 400);
    }
  },

  /**
   * GET /api/owner/kos/:kosId/availability
   * Mendapatkan jadwal & ketersediaan kamar untuk properti tertentu
   */
  async getRoomSchedule(req, res, next) {
    try {
      const { kosId } = req.params;
      const schedule = await db.getRoomAvailabilitySchedule(kosId);
      return successResponse(res, schedule, 'Jadwal ketersediaan kamar berhasil dimuat.');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memuat ketersediaan kamar.', 400);
    }
  },

  /**
   * GET /api/owner/rentals/expiring
   * Mendapatkan daftar sewa penghuni yang akan segera berakhir
   */
  async getExpiringRentals(req, res, next) {
    try {
      const ownerId = req.user.id;
      const expiring = await db.getExpiringRentals(ownerId, 'OWNER');
      return successResponse(res, expiring, 'Daftar sewa penghuni akan berakhir berhasil dimuat.');
    } catch (err) {
      next(err);
    }
  }
};

export default ownerController;

