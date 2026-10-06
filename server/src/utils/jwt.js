import jwt from 'jsonwebtoken';

// Fallback di bawah hanya untuk dev lokal. Nilainya juga tertulis di .env.example
// (repo publik), jadi token yang ditandatangani dengannya bisa dipalsukan siapa
// pun — lebih baik gagal saat boot daripada jalan diam-diam dengan key known.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET wajib diisi di environment produksi.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'singgah_super_secret_jwt_key_development_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token untuk user
 */
export const signToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verifikasi JWT token
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};
