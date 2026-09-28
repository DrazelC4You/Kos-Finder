import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import reviewController from '../controllers/reviewController.js';

const router = Router();

// 1. Publik: Lihat semua ulasan untuk kos tertentu
router.get('/kos/:kosId', reviewController.getKosReviews);

// 2. Tenant: Tulis ulasan, edit ulasan, hapus ulasan (Perlu login)
router.post('/kos/:kosId', authenticate, reviewController.createReview);
router.put('/:id', authenticate, reviewController.updateReview);
router.delete('/:id', authenticate, reviewController.deleteReview);

// 3. Owner: Lihat semua ulasan untuk kos miliknya & balas ulasan
router.get('/owner', authenticate, authorize('OWNER', 'ADMIN'), reviewController.getOwnerReviews);
router.post('/:id/reply', authenticate, authorize('OWNER', 'ADMIN'), reviewController.replyReview);

export default router;
