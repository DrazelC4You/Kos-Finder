import { Router } from 'express';
import { successResponse } from '../utils/response.js';
import { getDatabaseStatus } from '../services/db.js';
import authRoutes from './authRoutes.js';
import kosRoutes from './kosRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import reviewRoutes from './reviewRoutes.js';
import chatRoutes from './chatRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import adminRoutes from './adminRoutes.js';
import paymentRoutes from './paymentRoutes.js';
import agreementRoutes from './agreementRoutes.js';
import uploadRoutes from './uploadRoutes.js';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
    return successResponse(res, {
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    }, 'KosFinder API Server Berjalan Normal');
});

// Database status endpoint
router.get('/database/status', async (req, res) => {
    const { isPostgres } = await getDatabaseStatus();
    return successResponse(res, {
        provider: 'postgresql',
        orm: 'prisma',
        isConnectedToPostgres: isPostgres,
        mode: isPostgres ? 'PostgreSQL Active Connection' : 'Local Fallback Store Active (Development)',
        seedReady: true
    }, 'Status Database KosFinder');
});

// Authentication routes
router.use('/auth', authRoutes);

// Kos Listings routes
router.use('/kos', kosRoutes);

// Tenant Dashboard & Management routes
router.use('/tenant', tenantRoutes);

// Owner Kos Management routes
router.use('/owner', ownerRoutes);

// Review & Rating routes
router.use('/reviews', reviewRoutes);

// In-App Chat routes
router.use('/chat', chatRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// Admin Panel routes
router.use('/admin', adminRoutes);

// Payment routes
router.use('/payments', paymentRoutes);

// Digital Rental Agreement (SPK) & Invoice routes
router.use('/agreements', agreementRoutes);

// Image Upload routes
router.use('/uploads', uploadRoutes);

export default router;

