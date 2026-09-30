import rateLimit from 'express-rate-limit';

/**
 * Rate limiter untuk endpoint publik sensitif.
 * Mencegah bot/troll membuat banyak akun atau menembak reset-password masal.
 */

export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 5, // maksimal 5 request per IP per window
    standardHeaders: true, // mengirimkan header rate limit standar
    legacyHeaders: false, // menonaktifkan header rate limit lama
    skip: () => process.env.NODE_ENV === 'test', // test suite mendaftar banyak akun dari 1 IP
    message: {
        success: false,
        message: 'Terlalu banyak percobaan registrasi dari IP ini, silakan coba lagi setelah 1 jam.'
    }
});

