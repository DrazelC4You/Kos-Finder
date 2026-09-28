import { verifyToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/response.js';
import db from '../services/db.js';

/**
 * Authentication Middleware
 * Memeriksa Bearer Token JWT di header Authorization
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Akses ditolak. Token otentikasi tidak ditemukan.', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Sesi telah kedaluwarsa atau token tidak valid. Silakan login kembali.', 401);
    }

    const user = await db.findUserById(decoded.id);
    if (!user) {
      return errorResponse(res, 'Pengguna yang terkait dengan token ini tidak ditemukan.', 401);
    }

    // Hilangkan password dari object req.user demi keamanan
    const { password, ...safeUser } = user;
    req.user = safeUser;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return errorResponse(res, 'Gagal memverifikasi otentikasi.', 500);
  }
};

/**
 * Role-Based Authorization Middleware (RBAC)
 * Contoh: authorize('OWNER', 'ADMIN')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Otentikasi diperlukan terlebih dahulu.', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        `Akses ditolak. Peran '${req.user.role}' tidak memiliki hak akses ke resource ini.`,
        403
      );
    }

    next();
  };
};
