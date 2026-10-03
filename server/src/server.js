import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './services/prisma.js';
import { getDatabaseStatus } from './services/db.js';
import { runSeed } from '../prisma/seed.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`=========================================`);
    console.log(`🚀 KosFinder Server berjalan di port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);

    // Auto-seed hanya saat diminta eksplisit. Data demo berisi akun admin dengan
    // password seragam yang tercantum di repo, jadi tidak boleh terbentuk otomatis
    // di deploy pertama. Set SEED_DEMO_DATA=true untuk mengaktifkan.
    if (process.env.SEED_DEMO_DATA === 'true') {
        try {
            const { isPostgres } = await getDatabaseStatus();
            if (isPostgres) {
                const userCount = await prisma.user.count();
                if (userCount === 0) {
                    console.log('🌱 Database kosong terdeteksi — menjalankan seed awal...');
                    await runSeed();
                }
            }
        } catch (err) {
            console.error('⚠️ Auto-seed dilewati karena error:', err.message);
        }
    }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM signal diterima, menutup HTTP server...');
    server.close(() => {
        console.log('HTTP server ditutup.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal diterima, mematikan server...');
    server.close(() => {
        console.log('HTTP server ditutup.');
        process.exit(0);
    });
});
