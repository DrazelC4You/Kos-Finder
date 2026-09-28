import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  submitPayment,
  getPaymentByBooking,
  getTenantPayments,
  getOwnerPayments,
  confirmPayment,
  getOwnerFinancialSummary
} from '../controllers/paymentController.js';

const router = Router();

// -----------------------------------------------
// TENANT ROUTES — Penyewa
// -----------------------------------------------

// Kirim bukti pembayaran
router.post('/', authenticate, authorize('TENANT'), submitPayment);

// Riwayat pembayaran tenant
router.get('/tenant', authenticate, authorize('TENANT'), getTenantPayments);

// Detail pembayaran berdasarkan booking
router.get('/booking/:bookingId', authenticate, getPaymentByBooking);

// -----------------------------------------------
// OWNER ROUTES — Pemilik Kos
// -----------------------------------------------

// Daftar pembayaran masuk ke semua kos milik owner
router.get('/owner', authenticate, authorize('OWNER'), getOwnerPayments);

// Ringkasan keuangan owner
router.get('/summary/owner', authenticate, authorize('OWNER'), getOwnerFinancialSummary);

// Konfirmasi / tolak pembayaran
router.patch('/:id/confirm', authenticate, authorize('OWNER'), confirmPayment);

export default router;
