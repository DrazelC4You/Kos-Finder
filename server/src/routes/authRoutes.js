import { Router } from 'express';
import { register, login, getMe, logout, getDemoAccounts, forgotPassword, resetPassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { registerLimiter } from '../middleware/rateLimit.js'; 

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/demo-accounts', getDemoAccounts);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (harus menyertakan Bearer Token)
router.get('/me', authenticate, getMe);

export default router;
