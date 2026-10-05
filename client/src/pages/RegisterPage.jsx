import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/auth/AuthShell.jsx';
import FloatingInput from '../components/auth/FloatingInput.jsx';
import { Lock, Mail, User, Phone, Eye, EyeOff, AlertCircle, Building, SearchCheck, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') === 'OWNER' ? 'OWNER' : 'TENANT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Cloudflare Turnstile (anti-bot). Aktif hanya jika site key dikonfigurasi.
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const [cfToken, setCfToken] = useState(null);
  const turnstileContainerRef = useRef(null);
  const turnstileWidgetId = useRef(null);

  useEffect(() => {
    if (!turnstileSiteKey) return;

    const renderWidget = () => {
      if (!window.turnstile || !turnstileContainerRef.current || turnstileWidgetId.current !== null) return;
      turnstileWidgetId.current = window.turnstile.render(turnstileContainerRef.current, {
        sitekey: turnstileSiteKey,
        callback: (token) => setCfToken(token),
        'expired-callback': () => setCfToken(null),
        'error-callback': () => setCfToken(null)
      });
    };

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    document.head.appendChild(script);
  }, [turnstileSiteKey]);

  const resetTurnstile = () => {
    setCfToken(null);
    if (window.turnstile && turnstileWidgetId.current !== null) {
      window.turnstile.reset(turnstileWidgetId.current);
    }
  };

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (turnstileSiteKey && !cfToken) {
      setError('Silakan selesaikan verifikasi captcha terlebih dahulu.');
      return;
    }

    setLoading(true);

    try {
      const userData = await register({
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        cfTurnstileToken: cfToken
      });
      navigate(userData.role === 'OWNER' ? '/owner/dashboard' : '/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
      resetTurnstile();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-6 text-center lg:text-left">
        <h2 className="font-heading text-2xl font-bold text-slate-900">Daftar Akun Baru</h2>
        <p className="mt-1 text-sm text-slate-600">Gabung bersama ribuan pencari & pemilik kos</p>
      </div>

      <div className="rounded-3xl border border-slate-900/[0.06] bg-white/[0.38] p-7 shadow-[0_12px_40px_rgba(15,23,42,0.10)] ring-1 ring-white/60 backdrop-blur-2xl backdrop-saturate-150">
        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200/70 bg-red-50/80 p-3.5 text-sm text-red-700 backdrop-blur-sm">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Switcher Tabs */}
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Daftar Sebagai
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-900/[0.04] p-1">
              <button
                type="button"
                onClick={() => setRole('TENANT')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  role === 'TENANT'
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/[0.04]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <SearchCheck className="h-4 w-4" />
                <span>Pencari Kos</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('OWNER')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  role === 'OWNER'
                    ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/[0.04]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>Pemilik Kos</span>
              </button>
            </div>
          </div>

          <FloatingInput
            id="register-name"
            label="Nama Lengkap"
            icon={User}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
          />

          <FloatingInput
            id="register-email"
            label="Alamat Email"
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <FloatingInput
            id="register-phone"
            label="Nomor WhatsApp / HP"
            icon={Phone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            inputMode="tel"
          />

          <FloatingInput
            id="register-password"
            label="Kata Sandi (Min. 6 Karakter)"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
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

          <FloatingInput
            id="register-confirm-password"
            label="Konfirmasi Kata Sandi"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
          />

          {/* Cloudflare Turnstile Captcha */}
          {turnstileSiteKey && (
            <div className="flex justify-center pt-1">
              <div ref={turnstileContainerRef}></div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (turnstileSiteKey && !cfToken)}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              'Mendaftarkan Akun...'
            ) : (
              <>
                Daftar Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        Sudah memiliki akun?{' '}
        <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">
          Masuk di sini
        </Link>
      </p>
    </AuthShell>
  );
}
