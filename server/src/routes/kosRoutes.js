import { Router } from 'express';
import {
  getAllKos,
  getKosDetail,
  getKosAvailability,
  createKos,
  updateKos,
  deleteKos,
  getCampusLandmarks,
  getFacilityCategories
} from '../controllers/kosController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public routes (Phase 13 Landmarks & Facility Metadata & Phase 14 Availability)
router.get('/', getAllKos);
router.get('/landmarks', getCampusLandmarks);
router.get('/facilities/categories', getFacilityCategories);
router.get('/:id/availability', getKosAvailability);
router.get('/:id', getKosDetail);

// Protected routes (Khusus Pemilik Kos & Admin)
router.post('/', authenticate, authorize('OWNER', 'ADMIN'), createKos);
router.put('/:id', authenticate, authorize('OWNER', 'ADMIN'), updateKos);
router.delete('/:id', authenticate, authorize('OWNER', 'ADMIN'), deleteKos);

export default router;
