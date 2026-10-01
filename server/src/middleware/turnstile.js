import { errorResponse } from '../utils/response.js';

/**
 * Cloudflare Turnstile Verification Middleware
 * Memverifikasi token captcha dari widget Turnstile di sisi server.
 *
 * Perilaku:
 * - Jika TURNSTILE_SECRET_KEY tidak diisi ATAU sedang NODE_ENV=test,
 *   middleware dilewati (mode development / pengujian otomatis).
 * - Jika diisi, token wajib ada dan divalidasi ke API siteverify Cloudflare.
 */
export const verifyTurnstile = async (req, res, next) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || process.env.NODE_ENV === 'test') {
    return next();
  }

  const token = req.body?.cfTurnstileToken;
  if (!token) {
    return errorResponse(res, 'Verifikasi captcha wajib diselesaikan sebelum mendaftar.', 400);
  }

  try {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: req.ip
      })
    });

    const data = await verifyRes.json();
    if (!data.success) {
      return errorResponse(res, 'Verifikasi captcha gagal. Silakan muat ulang halaman dan selesaikan captcha lagi.', 400);
    }

    next();
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return errorResponse(res, 'Gagal memverifikasi captcha. Silakan coba lagi.', 500);
  }
};
