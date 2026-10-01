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

    // Auto-seed saat deploy pertama: jika PostgreSQL aktif & tabel user kosong,
    // isi dengan data demo. Kegagalan cukup dicatat, server tetap berjalan.
    if (process.env.NODE_ENV === 'production') {
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
