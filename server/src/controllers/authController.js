import bcrypt from 'bcryptjs';
import db from '../services/db.js';
import { signToken } from '../utils/jwt.js';
import { sendPasswordResetEmail } from '../services/mailer.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * Validasi email sederhana dengan regex
 */
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * REGISTER CONTROLLER
 * POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role = 'TENANT', phone } = req.body;

    // 1. Validasi Input
    if (!name || !email || !password) {
      return errorResponse(res, 'Nama, email, dan password wajib diisi.', 400);
    }

    if (!isValidEmail(email)) {
      return errorResponse(res, 'Format email tidak valid.', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password minimal harus terdiri dari 6 karakter.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 'Konfirmasi password tidak cocok dengan password.', 400);
    }

    const selectedRole = role.toUpperCase();
    if (!['TENANT', 'OWNER'].includes(selectedRole)) {
      return errorResponse(res, 'Role harus dipilih antara Pencari Kos (TENANT) atau Pemilik Kos (OWNER).', 400);
    }

    // 2. Cek apakah email sudah terdaftar
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return errorResponse(res, 'Email sudah terdaftar. Silakan gunakan email lain atau login.', 409);
    }

    // 3. Hash Password dengan bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Buat User Baru
    const newUser = await db.createUser({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone: phone ? phone.trim() : null,
      role: selectedRole,
      isVerified: selectedRole === 'TENANT', // Tenant langsung aktif, Owner bisa diverifikasi
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      profile: {
        bio: '',
        gender: null,
        occupation: selectedRole === 'TENANT' ? 'Pencari Kos' : 'Pemilik Properti Kos'
      }
    });

    // 5. Generate JWT Token
    const token = signToken({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role
    });

    const { password: _, ...safeUser } = newUser;

    return successResponse(res, {
      user: safeUser,
      token
    }, `Registrasi berhasil! Selamat datang di KosFinder sebagai ${selectedRole === 'OWNER' ? 'Pemilik Kos' : 'Pencari Kos'}.`, 201);
  } catch (err) {
    console.error('Register error:', err);
    return errorResponse(res, 'Terjadi kegagalan saat memproses pendaftaran akun.', 500);
  }
};

/**
 * LOGIN CONTROLLER
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validasi Input
    if (!email || !password) {
      return errorResponse(res, 'Email dan password wajib diisi.', 400);
    }

    // 2. Cari user berdasarkan email
    const user = await db.findUserByEmail(email);
    if (!user) {
      return errorResponse(res, 'Email atau password yang Anda masukkan salah.', 401);
    }

    // 3. Verifikasi password dengan bcrypt
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return errorResponse(res, 'Email atau password yang Anda masukkan salah.', 401);
    }

    // 4. Generate JWT Token
    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });

    const { password: _, ...safeUser } = user;

    return successResponse(res, {
      user: safeUser,
      token
    }, `Login berhasil! Selamat datang kembali, ${user.name}.`);
  } catch (err) {
    console.error('Login error:', err);
    return errorResponse(res, 'Terjadi kegagalan saat proses login.', 500);
  }
};

/**
 * GET ME (PROFILE USER LOGIN)
 * GET /api/auth/me
 */
export const getMe = async (req, res) => {
  return successResponse(res, req.user, 'Profil pengguna berhasil dimuat.');
};

/**
 * LOGOUT CONTROLLER
 * POST /api/auth/logout
 */
export const logout = (req, res) => {
  return successResponse(res, null, 'Logout berhasil. Sesi telah diakhiri.');
};

/**
 * FORGOT PASSWORD CONTROLLER
 * POST /api/auth/forgot-password
 * Mengirim link reset password ke email pengguna.
 * Selalu merespons sukses agar tidak membocorkan email terdaftar (anti enumeration).
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return errorResponse(res, 'Silakan masukkan alamat email yang valid.', 400);
    }

    const result = await db.createPasswordResetToken(email);
    if (result) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${result.token}`;
      await sendPasswordResetEmail(result.user.email, resetUrl);
    }

    return successResponse(res, null, 'Jika email terdaftar, tautan reset password telah dikirim ke email Anda.');
  } catch (err) {
    console.error('Forgot password error:', err);
    return errorResponse(res, 'Terjadi kesalahan saat memproses permintaan reset password.', 500);
  }
};

/**
 * RESET PASSWORD CONTROLLER
 * POST /api/auth/reset-password
 * Mengatur password baru berdasarkan token reset yang valid.
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return errorResponse(res, 'Token dan password baru wajib diisi.', 400);
    }

    if (password.length < 6) {
      return errorResponse(res, 'Password minimal harus terdiri dari 6 karakter.', 400);
    }

    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 'Konfirmasi password tidak cocok dengan password baru.', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const success = await db.resetUserPassword(token, hashedPassword);

    if (!success) {
      return errorResponse(res, 'Token reset tidak valid atau sudah kedaluwarsa. Silakan minta tautan reset baru.', 400);
    }

    return successResponse(res, null, 'Password berhasil diperbarui. Silakan login dengan password baru Anda.');
  } catch (err) {
    console.error('Reset password error:', err);
    return errorResponse(res, 'Terjadi kesalahan saat memperbarui password.', 500);
  }
};

/**
 * DEMO ACCOUNTS HELPER
 * GET /api/auth/demo-accounts
 * Memudahkan penguji memilih akun demo cepat untuk pengujian role
 */
export const getDemoAccounts = (req, res) => {
  return successResponse(res, [
    {
      role: 'OWNER',
      name: 'Bapak Anton Harmono',
      email: 'anton@kosfinder.com',
      password: 'Password123!',
      desc: 'Owner dengan 3 kos aktif di Purwokerto & Sokaraja'
    },
    {
      role: 'OWNER',
      name: 'Hj. Siti Aminah',
      email: 'siti@kosfinder.com',
      password: 'Password123!',
      desc: 'Owner Kost Melati Putri Eksklusif'
    },
    {
      role: 'TENANT',
      name: 'Rian Pratama',
      email: 'rian@gmail.com',
      password: 'Password123!',
      desc: 'Pencari kos / Mahasiswa dengan 1 booking aktif'
    },
    {
      role: 'ADMIN',
      name: 'Admin KosFinder',
      email: 'admin@kosfinder.com',
      password: 'Password123!',
      desc: 'Platform Administrator & Moderator'
    }
  ], 'Daftar Akun Demo Development');
};
