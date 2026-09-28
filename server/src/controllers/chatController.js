import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Controller untuk In-App Chat System (Pesan langsung antara Penyewa & Pemilik)
 */
export const chatController = {
  /**
   * GET /api/chat/conversations
   * Mengambil semua percakapan milik user yang sedang login (Penyewa atau Pemilik)
   */
  async getUserConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await db.getUserConversations(userId);
      return successResponse(res, data, 'Daftar percakapan berhasil dimuat');
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/chat/conversations
   * Membuka atau membuat ruang percakapan baru terkait kos tertentu
   * Body: { kosId, ownerId }
   */
  async startConversation(req, res, next) {
    try {
      const tenantId = req.user.id;
      const { kosId, ownerId } = req.body;

      if (!kosId) {
        return errorResponse(res, 'ID Kos wajib disertakan.', 400);
      }

      // Jika ownerId tidak disertakan, cari dari data kos
      let resolvedOwnerId = ownerId;
      if (!resolvedOwnerId) {
        const kos = await db.findKosById(kosId);
        if (!kos) return errorResponse(res, 'Kos tidak ditemukan.', 404);
        resolvedOwnerId = kos.ownerId;
      }

      if (tenantId === resolvedOwnerId) {
        return errorResponse(res, 'Anda tidak dapat memulai percakapan dengan diri sendiri.', 400);
      }

      const conversation = await db.getOrCreateConversation({
        tenantId,
        ownerId: resolvedOwnerId,
        kosId
      });

      return successResponse(res, conversation, 'Ruang percakapan siap digunakan', 201);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/chat/conversations/:id
   * Mengambil detail satu percakapan beserta seluruh pesan di dalamnya
   */
  async getConversationDetails(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const conversation = await db.getConversationDetails(id, userId);
      return successResponse(res, conversation, 'Detail percakapan berhasil dimuat');
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal memuat percakapan', 400);
    }
  },

  /**
   * POST /api/chat/conversations/:id/messages
   * Mengirim pesan baru ke dalam ruang percakapan
   * Body: { message }
   */
  async sendMessage(req, res, next) {
    try {
      const senderId = req.user.id;
      const { id: conversationId } = req.params;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return errorResponse(res, 'Isi pesan tidak boleh kosong.', 400);
      }

      const newMessage = await db.sendMessage({
        conversationId,
        senderId,
        message
      });

      return successResponse(res, newMessage, 'Pesan berhasil dikirim', 201);
    } catch (err) {
      return errorResponse(res, err.message || 'Gagal mengirim pesan', 400);
    }
  },

  /**
   * GET /api/chat/unread-count
   * Mendapatkan jumlah total pesan baru/belum dibaca
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.id;
      const count = await db.getUnreadChatCount(userId);
      return successResponse(res, { unreadCount: count }, 'Jumlah pesan baru');
    } catch (err) {
      next(err);
    }
  }
};

export default chatController;
