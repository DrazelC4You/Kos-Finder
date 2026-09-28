import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

// ================================================================
// PHASE 12: SISTEM PEMBAYARAN & KONFIRMASI SEWA
// ================================================================

/**
 * POST /api/payments
 * Tenant mengajukan bukti pembayaran untuk booking yang sudah APPROVED
 */
export const submitPayment = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const { bookingId, metodePembayaran, namaRekening, nomorRekening, jumlahTransfer, catatan } = req.body;

    if (!bookingId || !metodePembayaran || !jumlahTransfer) {
      return errorResponse(res, 'bookingId, metodePembayaran, dan jumlahTransfer wajib diisi', 400);
    }

    const payment = await db.createPayment({
      bookingId,
      tenantId,
      metodePembayaran,
      namaRekening: namaRekening || '',
      nomorRekening: nomorRekening || '',
      jumlahTransfer: Number(jumlahTransfer),
      catatan: catatan || ''
    });

    return successResponse(res, payment, 'Bukti pembayaran berhasil dikirim. Menunggu konfirmasi pemilik kos.', 201);
  } catch (err) {
    console.error('submitPayment error:', err);
    return errorResponse(res, err.message || 'Gagal mengirim pembayaran', 400);
  }
};

/**
 * GET /api/payments/booking/:bookingId
 * Ambil detail pembayaran berdasarkan booking
 */
export const getPaymentByBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const payment = await db.getPaymentByBookingId(bookingId, userId);
    if (!payment) return errorResponse(res, 'Data pembayaran tidak ditemukan', 404);

    return successResponse(res, payment, 'Detail pembayaran berhasil diambil');
  } catch (err) {
    console.error('getPaymentByBooking error:', err);
    return errorResponse(res, 'Gagal mengambil data pembayaran', 500);
  }
};

/**
 * GET /api/payments/tenant
 * Riwayat semua pembayaran milik tenant yang login
 */
export const getTenantPayments = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const payments = await db.getPaymentsByTenantId(tenantId);
    return successResponse(res, payments, 'Riwayat pembayaran berhasil diambil');
  } catch (err) {
    console.error('getTenantPayments error:', err);
    return errorResponse(res, 'Gagal mengambil riwayat pembayaran', 500);
  }
};

/**
 * GET /api/payments/owner
 * Daftar semua pembayaran masuk untuk semua kos milik owner
 */
export const getOwnerPayments = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const payments = await db.getPaymentsByOwnerId(ownerId);
    return successResponse(res, payments, 'Daftar pembayaran masuk berhasil diambil');
  } catch (err) {
    console.error('getOwnerPayments error:', err);
    return errorResponse(res, 'Gagal mengambil daftar pembayaran', 500);
  }
};

/**
 * PATCH /api/payments/:id/confirm
 * Owner mengkonfirmasi pembayaran → status CONFIRMED, booking jadi COMPLETED
 */
export const confirmPayment = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { id } = req.params;
    const { action, alasanPenolakan } = req.body; // action: 'confirm' | 'reject'

    if (!['confirm', 'reject'].includes(action)) {
      return errorResponse(res, 'Aksi tidak valid. Pilih: confirm atau reject', 400);
    }

    const result = await db.processPaymentConfirmation(id, ownerId, action, alasanPenolakan || '');
    if (!result) return errorResponse(res, 'Pembayaran tidak ditemukan atau tidak memiliki akses', 404);

    const msg = action === 'confirm'
      ? 'Pembayaran berhasil dikonfirmasi. Status sewa penyewa sekarang aktif.'
      : 'Pembayaran ditolak. Penyewa akan menerima notifikasi.';

    return successResponse(res, result, msg);
  } catch (err) {
    console.error('confirmPayment error:', err);
    return errorResponse(res, err.message || 'Gagal memproses konfirmasi pembayaran', 400);
  }
};

/**
 * GET /api/payments/summary/owner
 * Ringkasan keuangan untuk owner dashboard
 */
export const getOwnerFinancialSummary = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const summary = await db.getOwnerFinancialSummary(ownerId);
    return successResponse(res, summary, 'Ringkasan keuangan berhasil diambil');
  } catch (err) {
    console.error('getOwnerFinancialSummary error:', err);
    return errorResponse(res, 'Gagal mengambil ringkasan keuangan', 500);
  }
};
