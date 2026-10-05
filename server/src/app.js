import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import routes from './routes/index.js';
import storage from './services/storage.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Render mengakhiri TLS di edge-nya, jadi Express harus percaya satu proxy di
// depan. Tanpa ini express-rate-limit melihat semua pengunjung sebagai satu IP
// dan kuota 200/15 menit habis untuk orang pertama.
app.set('trust proxy', 1);

// Security HTTP headers. CSP butuh daftar host eksplisit karena default helmet
// hanya mengizinkan img-src 'self' data: — itu memblokir tile peta, foto
// fallback, dan avatar. Ganti VITE_MAP_TILE_URL = ganti juga daftar img-src.
// Turnstile butuh script + frame dari challenges.cloudflare.com; tombol login
// Google butuh accounts.google.com (script gsi/client + iframe popup) dan
// aset tombolnya di *.gstatic.com.
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            imgSrc: [
                "'self'",
                'data:',
                'https://*.tile.openstreetmap.org',
                'https://images.unsplash.com',
                'https://api.dicebear.com',
                'https://*.gstatic.com',
                'https://lh*.googleusercontent.com',
            ],
            scriptSrc: ["'self'", 'https://challenges.cloudflare.com', 'https://accounts.google.com'],
            frameSrc: ['https://challenges.cloudflare.com', 'https://accounts.google.com'],
        },
    },
}));

// CORS Configuration
const allowedOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logger
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
}

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images (local storage). CORP cross-origin agar bisa
// ditampilkan oleh frontend yang berjalan di origin berbeda.
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(storage.getRoot()));

// Rate Limiter
// Produksi: 200 req/15 menit per IP. Development: longgar agar SPA yang
// menembak banyak request paralel per halaman tidak mudah kena throttle.
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: Number(process.env.RATE_LIMIT_MAX) || (process.env.NODE_ENV === 'production' ? 200 : 5000),
    message: {
        success: false,
        message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi nanti.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', apiLimiter);

// API Base Routes
app.use('/api', routes);

// Static frontend (produksi): sajikan hasil build React dari client/dist
// beserta fallback SPA agar rute sisi-client (/cari, /kos/:id, dll) tetap
// mengembalikan index.html. Request /api dan /uploads tidak diganggu.
if (process.env.NODE_ENV === 'production') {
    const clientDist = path.resolve(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
        res.sendFile(path.join(clientDist, 'index.html'));
    });
}

// 404 & Error Handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
