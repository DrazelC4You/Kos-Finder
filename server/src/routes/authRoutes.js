import { Router } from 'express';
import { register, login, getMe, logout, getDemoAccounts, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { registerLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Public routes
router.post('/register', registerLimiter, register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/demo-accounts', getDemoAccounts);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);

// Protected routes (harus menyertakan Bearer Token)
router.get('/me', authenticate, getMe);
router.post('/resend-verification', authenticate, resendVerification);

export default router;
