import { Router } from 'express';
import { chatController } from '../controllers/chatController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Semua rute chat memerlukan autentikasi login
router.use(authenticate);

// Daftar percakapan pengguna
router.get('/conversations', chatController.getUserConversations);

// Membuka / memulai percakapan baru
router.post('/conversations', chatController.startConversation);

// Total unread messages
router.get('/unread-count', chatController.getUnreadCount);

// Detail satu percakapan beserta seluruh pesannya
router.get('/conversations/:id', chatController.getConversationDetails);

// Mengirim pesan baru ke percakapan
router.post('/conversations/:id/messages', chatController.sendMessage);

export default router;
