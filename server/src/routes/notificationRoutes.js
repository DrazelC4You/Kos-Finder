import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Semua rute notifikasi memerlukan autentikasi login
router.use(authenticate);

// Daftar notifikasi pengguna & jumlah unread
router.get('/', notificationController.getUserNotifications);

// Jumlah notifikasi belum dibaca saja
router.get('/unread-count', notificationController.getUnreadCount);

// Tandai semua notifikasi telah dibaca
router.put('/read-all', notificationController.markAllAsRead);

// Tandai satu notifikasi telah dibaca
router.put('/:id/read', notificationController.markAsRead);

// Hapus satu notifikasi
router.delete('/:id', notificationController.deleteNotification);

export default router;
