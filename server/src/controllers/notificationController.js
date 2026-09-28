import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk In-App Notification System (Lonceng Notifikasi)
 */
export const notificationController = {
  /**
   * GET /api/notifications
   * Mengambil semua notifikasi milik pengguna yang sedang login
   */
  async getUserNotifications(req, res, next) {
    try {
      const userId = req.user.id;
      const notifications = await db.getUserNotifications(userId);
      const unreadCount = await db.getUnreadNotificationCount(userId);
      return successResponse(res, { notifications, unreadCount }, 'Daftar notifikasi berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/notifications/unread-count
   * Menghitung total notifikasi yang belum dibaca
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const unreadCount = await db.getUnreadNotificationCount(userId);
      return successResponse(res, { unreadCount }, 'Jumlah notifikasi belum dibaca');
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/notifications/:id/read
   * Menandai satu notifikasi sebagai sudah dibaca
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const updated = await db.markNotificationAsRead(id, userId);
      return successResponse(res, updated, 'Notifikasi telah dibaca');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memperbarui notifikasi', 400);
    }
  },

  /**
   * PUT /api/notifications/read-all
   * Menandai semua notifikasi pengguna sebagai sudah dibaca
   */
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.id;
      await db.markAllNotificationsAsRead(userId);
      return successResponse(res, { success: true }, 'Semua notifikasi ditandai telah dibaca');
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/notifications/:id
   * Menghapus satu notifikasi
   */
  async deleteNotification(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await db.deleteNotification(id, userId);
      return successResponse(res, { id }, 'Notifikasi berhasil dihapus');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal menghapus notifikasi', 400);
    }
  }
};

export default notificationController;
