import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import tenantController from '../controllers/tenantController.js';

const router = Router();

// Semua rute tenant wajib login & memiliki peran TENANT
router.use(authenticate);
router.use(authorize('TENANT'));

// 1. Dashboard Overview Stats & Recent Bookings
router.get('/dashboard', tenantController.getDashboard);

// 2. Bookings Management
router.get('/bookings', tenantController.getBookings);
router.post('/bookings', tenantController.createBooking);
router.put('/bookings/:id/cancel', tenantController.cancelBooking);
router.post('/bookings/:id/extend', tenantController.requestExtension);

// 3. Rental Expiration Monitoring
router.get('/rentals/expiring', tenantController.getExpiringRentals);

// 4. Favorites Management
router.get('/favorites', tenantController.getFavorites);
router.post('/favorites/:kosId', tenantController.addFavorite);
router.delete('/favorites/:kosId', tenantController.removeFavorite);

// 5. Tenant Profile Update
router.put('/profile', tenantController.updateProfile);

export default router;
