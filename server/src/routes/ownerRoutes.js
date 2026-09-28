import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import ownerController from '../controllers/ownerController.js';

const router = Router();

// Semua rute owner wajib login & memiliki peran OWNER atau ADMIN
router.use(authenticate);
router.use(authorize('OWNER', 'ADMIN'));

// 1. Dashboard Overview Stats & Properties
router.get('/dashboard', ownerController.getDashboard);

// 2. Kos Listing Management
router.get('/kos', ownerController.getKosList);
router.post('/kos', ownerController.createKos);
router.put('/kos/:id', ownerController.updateKos);
router.delete('/kos/:id', ownerController.deleteKos);

// 3. Room Management & Availability Schedule
router.post('/kos/:kosId/rooms', ownerController.addRoom);
router.put('/rooms/:roomId', ownerController.updateRoom);
router.delete('/rooms/:roomId', ownerController.deleteRoom);
router.get('/kos/:kosId/availability', ownerController.getRoomSchedule);

// 4. Booking Requests & Approval Management
router.get('/bookings', ownerController.getBookings);
router.put('/bookings/:id/status', ownerController.updateBookingStatus);
router.put('/bookings/:id/extend', ownerController.processExtension);

// 5. Expiring Rentals Monitoring
router.get('/rentals/expiring', ownerController.getExpiringRentals);

export default router;
