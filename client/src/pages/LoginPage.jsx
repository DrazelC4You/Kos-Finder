import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import FloatingInput from '../components/auth/FloatingInput.jsx';
import { Lock, Mail, Eye, EyeOff, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Google Identity Services. Tanpa VITE_GOOGLE_CLIENT_ID blok ini tidak
  // pernah di-render, sama seperti pola Turnstile di halaman daftar.
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const googleBtnRef = useRef(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!googleClientId) return undefined;
    let cancelled = false;

    const renderWidget = () => {
      const gsi = window.google?.accounts?.id;
      if (cancelled || !gsi || !googleBtnRef.current) return;
      gsi.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          setGoogleLoading(true);
          setError('');
          try {
            await loginWithGoogle(credential);
            navigate(from, { replace: true });
          } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login Google gagal. Silakan coba lagi.');
          } finally {
            setGoogleLoading(false);
          }
        }
      });
      gsi.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'continue_with'
      });
    };

    if (window.google?.accounts?.id) {
      renderWidget();
      return undefined;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => { cancelled = true; };
    // loginWithGoogle/navigate/from stabilish sepanjang halaman ini; ikut
    // dijadikan dependency akan membuat widget Google diinisialisasi ulang
    // setiap kali state form berubah.
  }, [googleClientId]);

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

  // Akun demo memakai password seed yang ada di repo, jadi tidak boleh
  // ter-render di bundle produksi. import.meta.env.DEV di-inline Vite
  // sehingga branch ini ter-strip total saat build.
  const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV;

  return (
    <AuthShell>
      <div className="mb-6 text-center lg:text-left">
        <h2 className="font-heading text-2xl font-bold text-slate-900">Masuk ke Akun Anda</h2>
        <p className="mt-1 text-sm text-slate-600">Pilih hunian kos atau kelola properti Anda</p>
      </div>

      <div className="rounded-3xl border border-slate-900/[0.06] bg-white/[0.38] p-7 shadow-[0_12px_40px_rgba(15,23,42,0.10)] ring-1 ring-white/60 backdrop-blur-2xl backdrop-saturate-150">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200/70 bg-red-50/80 p-3.5 text-sm text-red-700 backdrop-blur-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FloatingInput
            id="login-email"
            label="Alamat Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <FloatingInput
            id="login-password"
            label="Kata Sandi"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="text-slate-400 transition-colors hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />

          <div className="-mt-1 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Lupa password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              'Memproses Masuk...'
            ) : (
              <>
                Masuk Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Pembatas + tombol resmi Google (hanya saat client ID dikonfigurasi) */}
        {googleClientId && (
          <div className="mt-5">
            <div className="flex items-center py-1">
              <div className="flex-grow border-t border-slate-900/10" />
              <span className="mx-4 flex-shrink text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                atau
              </span>
              <div className="flex-grow border-t border-slate-900/10" />
            </div>
            <div ref={googleBtnRef} className="mt-3 flex justify-center" />
            {googleLoading && (
              <p className="mt-2 text-center text-xs text-slate-500">Menyelesaikan login Google…</p>
            )}
          </div>
        )}

        {/* Quick Demo Accounts Selection */}
        {SHOW_DEMO_ACCOUNTS && (
          <div className="mt-6 border-t border-slate-900/[0.06] pt-5">
            <div className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Pilih Akun Demo (1 Klik):</span>
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
              className="mb-3 flex w-full items-center justify-between rounded-xl border border-emerald-600/25 bg-emerald-600/[0.08] p-3 text-left text-emerald-900 transition-colors hover:bg-emerald-600/[0.14]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">🔍 Rian Pratama</span>
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
                    REKOMENDASI PHASE 6
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-emerald-700">
                  Role: TENANT (Pencari Kos dengan 2 Booking & 2 Favorit Siap Diuji)
                </div>
              </div>
              <span className="rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                Masuk Langsung ➔
              </span>
            </button>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('anton@singgah.test', 'Password123!')}
                className="rounded-lg border border-slate-900/[0.08] bg-white/40 p-2 text-left font-medium text-slate-800 transition-colors hover:bg-white/70"
              >
                🏠 <strong>Bapak Anton</strong>
                <div className="text-[10px] text-slate-500">OWNER (Pemilik)</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('siti@singgah.test', 'Password123!')}
                className="rounded-lg border border-slate-900/[0.08] bg-white/40 p-2 text-left font-medium text-slate-800 transition-colors hover:bg-white/70"
              >
                🏠 <strong>Hj. Siti</strong>
                <div className="text-[10px] text-slate-500">OWNER (Putri)</div>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@singgah.test', 'Password123!')}
                className="rounded-lg border border-slate-900/[0.08] bg-white/40 p-2 text-left font-medium text-slate-800 transition-colors hover:bg-white/70"
              >
                🛡️ <strong>Admin</strong>
                <div className="text-[10px] text-slate-500">ADMINISTRATOR</div>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Belum memiliki akun Singgah?{' '}
        <Link to="/register" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
          Daftar Sekarang
        </Link>
      </p>
    </AuthShell>
  );
}
