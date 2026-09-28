import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError('Tidak dapat terhubung ke server backend. Pastikan server port 5000 menyala.');
      } else if (err.response.status === 500) {
        setError(err.response.data?.message || 'Server backend sedang mengalami kendala atau belum siap. Silakan coba lagi.');
      } else {
        setError(err.response.data?.message || err.message || 'Login gagal. Silakan periksa kembali email dan password Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Quick fill untuk akun demo
  const fillDemoAccount = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-heading font-extrabold text-2xl text-slate-900 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Home className="w-5 h-5" />
            </div>
            <span>Kos<span className="text-emerald-600">Finder</span></span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">Masuk ke Akun Anda</h2>
          <p className="text-sm text-slate-500 mt-1">Pilih hunian kos atau kelola properti Anda</p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Kata Sandi
                </label>
                <Link to="/forgot-password" className="text-xs text-emerald-600 hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk Sekarang'}
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Pilih Akun Demo (1 Klik):</span>
              </div>
            </div>

            {/* Rekomendasi Utama: Pencari Kos untuk Phase 6 */}
            <button
              type="button"
              onClick={async () => {
                fillDemoAccount('rian@gmail.com', 'Password123!');
                setError('');
                setLoading(true);
                try {
                  await login('rian@gmail.com', 'Password123!');
                  navigate('/tenant/dashboard', { replace: true });
                } catch (e) {
                  setError('Gagal masuk sebagai akun demo.');
                } finally {
                  setLoading(false);
                }
              }}
              className="w-full mb-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 border-2 border-emerald-500/30 text-left transition-all shadow-sm flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">🔍 Rian Pratama</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">REKOMENDASI PHASE 6</span>
                </div>
                <div className="text-xs text-emerald-700 mt-0.5">Role: TENANT (Pencari Kos dengan 2 Booking & 2 Favorit Siap Diuji)</div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-lg shadow-sm border border-emerald-200">
                Masuk Langsung ➔
              </span>
            </button>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('anton@kosfinder.com', 'Password123!')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium border border-slate-200 text-left transition-colors"
              >
                🏠 <strong>Bapak Anton</strong>
                <div className="text-[10px] text-slate-500">OWNER (Pemilik)</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('siti@kosfinder.com', 'Password123!')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium border border-slate-200 text-left transition-colors"
              >
                🏠 <strong>Hj. Siti</strong>
                <div className="text-[10px] text-slate-500">OWNER (Putri)</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@kosfinder.com', 'Password123!')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium border border-slate-200 text-left transition-colors"
              >
                🛡️ <strong>Admin</strong>
                <div className="text-[10px] text-slate-500">ADMINISTRATOR</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Belum memiliki akun KosFinder?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 hover:underline">
            Daftar Sekarang
          </Link>
        </p>
      </div>
    </div>
  );
}
