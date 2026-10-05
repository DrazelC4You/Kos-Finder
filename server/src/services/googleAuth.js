import { OAuth2Client } from 'google-auth-library';

/**
 * Verifikasi ID token Google Identity Services (aliran credential — tidak butuh
 * redirect URI, cukup origin JavaScript didaftarkan di Google Cloud Console).
 * Dibungkus objek supaya test bisa menambal verifyCredential tanpa jaringan.
 */
let client = null;

export const googleAuth = {
  isConfigured() {
    return Boolean(process.env.GOOGLE_CLIENT_ID);
  },

  /**
   * @returns payload { sub, email, email_verified, name, picture } atau null.
   */
  async verifyCredential(credential) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !credential) return null;
    if (!client) client = new OAuth2Client(clientId);

    try {
      const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
      const payload = ticket.getPayload();
      // email_verified wajib true: tanpa syarat ini orang bisa membuat akun
      // Google berisi email milik korban lalu menaungi akun korban lewat link.
      if (!payload || payload.email_verified !== true) return null;
      return payload;
    } catch (err) {
      console.warn('Verifikasi ID token Google gagal:', err.message);
      return null;
    }
  }
};
