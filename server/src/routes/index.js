import { Router } from 'express';
import { successResponse, errorResponse } from '../utils/response.js';
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

// Health check endpoint — Render memakainya sebagai healthCheckPath, jadi harus
// ikut membusuk kalau database mati. Kalau selalu UP, service dilaporkan sehat
// padahal seluruh tulisannya masuk ke memory store.
router.get('/health', async (req, res) => {
    const { isPostgres } = await getDatabaseStatus();
    // Di luar produksi, memory store memang mode development yang sah, jadi
    // hanya produksi tanpa Postgres yang dihitung gagal.
    const failing = !isPostgres && process.env.NODE_ENV === 'production';
    const data = {
        status: failing ? 'DEGRADED' : 'UP',
        database: isPostgres ? 'postgresql' : 'memory',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    };

    if (failing) {
        return errorResponse(res, 'API hidup, tetapi PostgreSQL tidak terjangkau', 503, data);
    }
    return successResponse(res, data, 'KosFinder API Server Berjalan Normal');
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

