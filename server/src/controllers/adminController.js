import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ================================================================
// ADMIN DASHBOARD - STATISTIK PLATFORM
// ================================================================

/**
 * GET /api/admin/stats
 * Statistik keseluruhan platform untuk dashboard admin
 */
export const getPlatformStats = async (req, res) => {
  try {
    const stats = await db.getAdminStats();
    return successResponse(res, stats, 'Statistik platform berhasil diambil');
  } catch (err) {
    console.error('getPlatformStats error:', err);
    return errorResponse(res, 'Gagal mengambil statistik platform', 500);
  }
};

// ================================================================
// ADMIN USER MANAGEMENT
// ================================================================

/**
 * GET /api/admin/users
 * Daftar semua pengguna platform
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const users = await db.adminGetAllUsers({ role, search, page: Number(page), limit: Number(limit) });
    return successResponse(res, users, 'Daftar pengguna berhasil diambil');
  } catch (err) {
    console.error('getAllUsers error:', err);
    return errorResponse(res, 'Gagal mengambil daftar pengguna', 500);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Ubah peran pengguna (ADMIN, OWNER, TENANT)
 */
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['ADMIN', 'OWNER', 'TENANT'].includes(role)) {
      return errorResponse(res, 'Peran tidak valid. Pilih: ADMIN, OWNER, atau TENANT', 400);
    }
    if (id === req.user.id) {
      return errorResponse(res, 'Anda tidak dapat mengubah peran akun Anda sendiri', 400);
    }

    const updated = await db.adminUpdateUserRole(id, role);
    if (!updated) return errorResponse(res, 'Pengguna tidak ditemukan', 404);

    return successResponse(res, updated, `Peran pengguna berhasil diubah menjadi ${role}`);
  } catch (err) {
    console.error('updateUserRole error:', err);
    return errorResponse(res, 'Gagal mengubah peran pengguna', 500);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Aktifkan/nonaktifkan (ban) akun pengguna via isVerified flag
 */
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    if (id === req.user.id) {
      return errorResponse(res, 'Anda tidak dapat menonaktifkan akun Anda sendiri', 400);
    }

    const updated = await db.adminToggleUserStatus(id, Boolean(isVerified));
    if (!updated) return errorResponse(res, 'Pengguna tidak ditemukan', 404);

    const action = isVerified ? 'diaktifkan' : 'dinonaktifkan';
    return successResponse(res, updated, `Akun pengguna berhasil ${action}`);
  } catch (err) {
    console.error('toggleUserStatus error:', err);
    return errorResponse(res, 'Gagal mengubah status pengguna', 500);
  }
};

// ================================================================
// ADMIN KOS LISTING MANAGEMENT
// ================================================================

/**
 * GET /api/admin/listings
 * Daftar semua kos (semua status) untuk manajemen admin
 */
export const getAllListings = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const listings = await db.adminGetAllListings({ status, search, page: Number(page), limit: Number(limit) });
    return successResponse(res, listings, 'Daftar listing kos berhasil diambil');
  } catch (err) {
    console.error('getAllListings error:', err);
    return errorResponse(res, 'Gagal mengambil daftar listing', 500);
  }
};

/**
 * PATCH /api/admin/listings/:id/verify
 * Verifikasi kos: approve/reject/set status
 */
export const verifyListing = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject' | 'suspend'

    if (!['approve', 'reject', 'suspend'].includes(action)) {
      return errorResponse(res, 'Aksi tidak valid. Pilih: approve, reject, atau suspend', 400);
    }

    const kos = await db.getKosById(id);
    if (!kos) return errorResponse(res, 'Listing kos tidak ditemukan', 404);

    let newStatus, isVerified, notifTitle, notifMsg, notifType;

    if (action === 'approve') {
      newStatus = 'ACTIVE';
      isVerified = true;
      notifTitle = '✅ Listing Kos Diverifikasi';
      notifMsg = `Listing kos "${kos.nama}" Anda telah diverifikasi dan sekarang aktif di platform KosFinder.`;
      notifType = 'LISTING_VERIFIED';
    } else if (action === 'reject') {
      newStatus = 'REJECTED';
      isVerified = false;
      notifTitle = '❌ Listing Kos Ditolak';
      notifMsg = `Listing kos "${kos.nama}" Anda ditolak.${reason ? ` Alasan: ${reason}` : ''} Silakan perbaiki dan ajukan kembali.`;
      notifType = 'SYSTEM_INFO';
    } else {
      newStatus = 'INACTIVE';
      isVerified = false;
      notifTitle = '⚠️ Listing Kos Ditangguhkan';
      notifMsg = `Listing kos "${kos.nama}" Anda telah ditangguhkan oleh admin.${reason ? ` Alasan: ${reason}` : ''}`;
      notifType = 'SYSTEM_INFO';
    }

    const updated = await db.adminUpdateListingStatus(id, { status: newStatus, isVerified });

    // Kirim notifikasi ke pemilik kos
    await db.createNotification({
      userId: kos.ownerId,
      title: notifTitle,
      message: notifMsg,
      type: notifType,
      link: `/kos/${id}`
    });

    return successResponse(res, updated, `Listing kos berhasil di-${action === 'approve' ? 'setujui' : action === 'reject' ? 'tolak' : 'tangguhkan'}`);
  } catch (err) {
    console.error('verifyListing error:', err);
    return errorResponse(res, 'Gagal memproses verifikasi listing', 500);
  }
};

// ================================================================
// ADMIN REPORT MANAGEMENT
// ================================================================

/**
 * GET /api/admin/reports
 * Daftar semua laporan konten
 */
export const getAllReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const reports = await db.adminGetAllReports({ status, page: Number(page), limit: Number(limit) });
    return successResponse(res, reports, 'Daftar laporan berhasil diambil');
  } catch (err) {
    console.error('getAllReports error:', err);
    return errorResponse(res, 'Gagal mengambil daftar laporan', 500);
  }
};

/**
 * POST /api/admin/reports
 * Buat laporan baru (penyewa melaporkan kos)
 */
export const createReport = async (req, res) => {
  try {
    const { kosId, reason } = req.body;
    if (!kosId || !reason?.trim()) {
      return errorResponse(res, 'kosId dan alasan laporan wajib diisi', 400);
    }

    const kos = await db.getKosById(kosId);
    if (!kos) return errorResponse(res, 'Kos tidak ditemukan', 404);

    const report = await db.adminCreateReport({
      reporterId: req.user.id,
      kosId,
      reason: reason.trim()
    });

    return successResponse(res, report, 'Laporan berhasil dikirim', 201);
  } catch (err) {
    console.error('createReport error:', err);
    return errorResponse(res, 'Gagal mengirim laporan', 500);
  }
};

/**
 * PATCH /api/admin/reports/:id
 * Resolusi laporan: resolve atau dismiss
 */
export const resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'resolve' | 'dismiss'

    if (!['resolve', 'dismiss'].includes(action)) {
      return errorResponse(res, 'Aksi tidak valid. Pilih: resolve atau dismiss', 400);
    }

    const updated = await db.adminUpdateReportStatus(id, action === 'resolve' ? 'RESOLVED' : 'DISMISSED');
    if (!updated) return errorResponse(res, 'Laporan tidak ditemukan', 404);

    return successResponse(res, updated, `Laporan berhasil di-${action === 'resolve' ? 'selesaikan' : 'tolak'}`);
  } catch (err) {
    console.error('resolveReport error:', err);
    return errorResponse(res, 'Gagal memproses laporan', 500);
  }
};

// ================================================================
// ADMIN REVIEW MODERATION
// ================================================================

/**
 * GET /api/admin/reviews
 * Daftar semua ulasan untuk moderasi
 */
export const getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await db.adminGetAllReviews({ page: Number(page), limit: Number(limit) });
    return successResponse(res, reviews, 'Daftar ulasan berhasil diambil');
  } catch (err) {
    console.error('getAllReviews error:', err);
    return errorResponse(res, 'Gagal mengambil daftar ulasan', 500);
  }
};

/**
 * DELETE /api/admin/reviews/:id
 * Hapus ulasan yang melanggar aturan
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.adminDeleteReview(id);
    if (!deleted) return errorResponse(res, 'Ulasan tidak ditemukan', 404);
    return successResponse(res, null, 'Ulasan berhasil dihapus oleh admin');
  } catch (err) {
    console.error('deleteReview (admin) error:', err);
    return errorResponse(res, 'Gagal menghapus ulasan', 500);
  }
};
