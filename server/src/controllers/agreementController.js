import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk mengelola Surat Perjanjian Sewa (SPK) Digital & Kwitansi Resmi
 */
export const agreementController = {
  /**
   * GET /api/agreements/:bookingId
   * Mengambil data draft atau SPK resmi untuk booking tertentu
   */
  async getAgreement(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      const agreement = await db.getOrCreateAgreement(bookingId, userId);
      return successResponse(res, agreement, 'Data Surat Perjanjian Sewa (SPK) berhasil dimuat.');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memuat Surat Perjanjian Sewa.', 400);
    }
  },

  /**
   * POST /api/agreements/:bookingId/sign
   * Menandatangani SPK digital secara elektronik
   */
  async signAgreement(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;
      const role = req.user.role;
      const { signatureName } = req.body;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

      const signedAgreement = await db.signAgreement(bookingId, userId, role, signatureName, ipAddress);
      return successResponse(res, signedAgreement, 'Tanda tangan elektronik berhasil dibubuhkan pada dokumen perjanjian!');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal menandatangani perjanjian sewa.', 400);
    }
  },

  /**
   * GET /api/agreements/:bookingId/invoice
   * Mengambil data invoice pembayaran & kwitansi resmi lunas
   */
  async getInvoice(req, res, next) {
    try {
      const { bookingId } = req.params;
      const userId = req.user.id;

      const invoiceData = await db.getInvoiceAndReceipt(bookingId, userId);
      return successResponse(res, invoiceData, 'Data invoice & kwitansi resmi berhasil dimuat.');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memuat invoice & kwitansi.', 400);
    }
  }
};

export default agreementController;
