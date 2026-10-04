import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Loader2, MailWarning } from 'lucide-react';
import api from '../services/api.js';
import BrandLogo from '../components/BrandLogo.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;

    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Tautan verifikasi tidak lengkap. Silakan minta tautan verifikasi baru.');
        return;
      }
      try {
        const res = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data.message || 'Email berhasil diverifikasi!');
      } catch (err) {
        setStatus('error');
        if (!err.response) {
          setMessage('Tidak dapat terhubung ke server backend. Pastikan server port 5000 menyala.');
        } else {
          setMessage(err.response.data?.message || 'Token verifikasi tidak valid atau sudah kedaluwarsa.');
        }
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-heading font-extrabold text-2xl text-slate-900 mb-2">
            <BrandLogo className="w-12 h-12" />
            <span>Kos<span className="text-emerald-600">Finder</span></span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">Verifikasi Email</h2>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-sm border border-slate-200 text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
              <p className="text-sm text-slate-600">Memverifikasi email Anda...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-700">{message}</p>
              <p className="text-xs text-slate-500">
                Jika Anda sedang login, muat ulang halaman dashboard agar status verifikasi diperbarui.
              </p>
              <Link
                to="/owner/dashboard"
                className="mt-2 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                Buka Dashboard Pemilik
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <MailWarning className="w-12 h-12 text-red-500" />
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 text-red-700 text-sm border border-red-200 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
                <span>{message}</span>
              </div>
              <p className="text-xs text-slate-500">
                Login ke dashboard pemilik lalu gunakan tombol "Kirim Ulang Email Verifikasi" untuk mendapatkan tautan baru.
              </p>
              <Link
                to="/login"
                className="mt-2 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                Ke Halaman Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
