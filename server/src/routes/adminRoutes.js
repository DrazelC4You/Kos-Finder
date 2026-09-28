import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPlatformStats,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllListings,
  verifyListing,
  getAllReports,
  createReport,
  resolveReport,
  getAllReviews,
  deleteReview
} from '../controllers/adminController.js';

const router = Router();

// Semua route admin memerlukan otentikasi + role ADMIN
// kecuali createReport yang bisa dilakukan oleh siapa saja yang sudah login

// -----------------------------------------------
// STATISTIK PLATFORM
// -----------------------------------------------
router.get('/stats', authenticate, authorize('ADMIN'), getPlatformStats);

// -----------------------------------------------
// MANAJEMEN PENGGUNA
// -----------------------------------------------
router.get('/users', authenticate, authorize('ADMIN'), getAllUsers);
router.patch('/users/:id/role', authenticate, authorize('ADMIN'), updateUserRole);
router.patch('/users/:id/status', authenticate, authorize('ADMIN'), toggleUserStatus);

// -----------------------------------------------
// VERIFIKASI LISTING KOS
// -----------------------------------------------
router.get('/listings', authenticate, authorize('ADMIN'), getAllListings);
router.patch('/listings/:id/verify', authenticate, authorize('ADMIN'), verifyListing);

// -----------------------------------------------
// LAPORAN KONTEN
// -----------------------------------------------
router.get('/reports', authenticate, authorize('ADMIN'), getAllReports);
router.post('/reports', authenticate, createReport); // Semua user bisa lapor
router.patch('/reports/:id', authenticate, authorize('ADMIN'), resolveReport);

// -----------------------------------------------
// MODERASI ULASAN
// -----------------------------------------------
router.get('/reviews', authenticate, authorize('ADMIN'), getAllReviews);
router.delete('/reviews/:id', authenticate, authorize('ADMIN'), deleteReview);

export default router;
