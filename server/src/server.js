import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 KosFinder Server berjalan di port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`=========================================`);
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
