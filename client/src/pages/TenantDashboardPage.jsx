import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar, CheckCircle, Clock, Heart, MapPin,
  ExternalLink, MessageSquare, AlertCircle, XCircle,
  Save, Loader2, ArrowRight, ShieldCheck, Sparkles, AlertTriangle,
  CreditCard, Send, CircleX, BadgeCheck, RefreshCw,
  FileText, Receipt
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah } from '../components/KosCard.jsx';
import RentalAgreementModal from '../components/RentalAgreementModal.jsx';
import OfficialInvoiceModal from '../components/OfficialInvoiceModal.jsx';

// Alat pengisi data contoh mengirim booking/favorit nyata ke API, jadi hanya
// boleh muncul di dev. import.meta.env.DEV di-inline Vite sehingga branch ini
// ter-strip dari bundle produksi.
const SHOW_DEMO_TOOLS = import.meta.env.DEV;

// Tab dan filter dibaca dari URL, dan nilai di luar daftar ini harus di-fallback:
// tiap panel dicocokkan dengan `activeTab === '...'`, jadi satu karakter salah
// membuat halaman menampilkan bar tab tanpa konten sama sekali.
const TABS = [
  { key: 'ringkasan', label: 'Ringkasan' },
  { key: 'riwayat', label: 'Riwayat Booking' },
  { key: 'favorit', label: 'Kos Favorit' },
  { key: 'profil', label: 'Profil Saya' },
  { key: 'pembayaran', label: 'Pembayaran' }
];
const TAB_KEYS = TABS.map(t => t.key);
const STATUS_KEYS = ['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'CANCELLED', 'REJECTED'];

/**
 * Panel data tidak boleh memutuskan "kosong" sebelum datanya benar-benar tiba.
 * Sebelumnya kegagalan fetch hanya jadi console.error + toast 3,5 detik sehingga
 * ringkasan menulis "Belum Ada Pengajuan Sewa" untuk koneksi yang mati.
 */
function FailedPanel({ message, onRetry }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="font-heading text-sm font-bold text-slate-900">Data gagal dimuat</h3>
        <p className="mt-1 text-xs text-slate-500">{message || 'Periksa koneksi Anda, lalu coba lagi.'}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>Coba lagi</span>
      </button>
    </div>
  );
}

function ListSkeleton({ rows = 2 }) {
  return (
    <div aria-hidden="true" className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5">
          <div className="h-3 w-28 rounded bg-slate-200" />
          <div className="mt-3 h-8 w-40 rounded bg-slate-100" />
          <div className="mt-3 h-3 w-full max-w-md rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function PanelState({ status, error, onRetry, skeleton, children }) {
  if (status === 'loading') return skeleton || <ListSkeleton />;
  if (status === 'error') return <FailedPanel message={error} onRetry={onRetry} />;
  return children;
}

// Satu peta status untuk badge booking MAUPUN pembayaran. Sebelumnya keduanya
// punya implementasi sendiri — sebuah switch untuk booking dan tiga blok JSX
// inline untuk pembayaran — sehingga menambah status baru harus diingat di dua
// tempat. Itulah cara COMPLETED lolos dari UI.
const STATUS_TONE = {
  amber: { pill: "bg-amber-100 text-amber-800 border-amber-200", icon: "text-amber-600" },
  emerald: { pill: "bg-emerald-100 text-emerald-800 border-emerald-200", icon: "text-emerald-600" },
  rose: { pill: "bg-rose-100 text-rose-800 border-rose-200", icon: "text-rose-600" },
  slate: { pill: "bg-slate-100 text-slate-700 border-slate-200", icon: "text-slate-500" }
};

const STATUS_META = {
  "booking:PENDING": { label: "Menunggu Konfirmasi", icon: Clock, tone: "amber" },
  "booking:APPROVED": { label: "Disetujui / Aktif", icon: CheckCircle, tone: "emerald" },
  // Sewa yang sudah dibayar dan dikonfirmasi pemilik. Server tetap mengizinkan
  // SPK, kwitansi, dan perpanjangan untuk status ini.
  "booking:COMPLETED": { label: "Selesai / Lunas", icon: BadgeCheck, tone: "emerald" },
  "booking:REJECTED": { label: "Ditolak", icon: CircleX, tone: "rose" },
  "booking:CANCELLED": { label: "Dibatalkan", icon: AlertCircle, tone: "slate" },
  "payment:PENDING": { label: "Menunggu Verifikasi Pemilik", icon: Clock, tone: "amber" },
  "payment:CONFIRMED": { label: "Dikonfirmasi (Lunas)", icon: BadgeCheck, tone: "emerald" },
  "payment:REJECTED": { label: "Ditolak", icon: CircleX, tone: "rose" }
};

function StatusBadge({ kind, status }) {
  const meta = STATUS_META[`${kind}:${status}`];
  if (!meta) {
    // Status yang belum dipetakan tetap ditampilkan apa adanya, bukan hilang.
    return (
      <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
        {status}
      </span>
    );
  }
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_TONE[meta.tone].pill}`}>
      <Icon className={`w-3.5 h-3.5 ${STATUS_TONE[meta.tone].icon}`} />
      {meta.label}
    </span>
  );
}

const FALLBACK_FOTO = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500';

/**
 * Satu kartu booking, dipakai tab Ringkasan (pengajuan terbaru) dan Riwayat
 * (list). Sebelumnya objek yang sama dirender dua kali dengan struktur 90%
 * paralel, dan "Batalkan Pengajuan" punya dua entry point ke modal yang sama.
 *
 * Aksi sengaja diterima sebagai prop supaya kartu tetap tahu cara dipakai.
 */
function BookingCard({ booking: b, compact = false, onAgreement, onInvoice, onExtend, onPay, onCancel }) {
  const isOpen = ['APPROVED', 'COMPLETED'].includes(b.status);
  const canPay = b.status === 'APPROVED' || b.status === 'PENDING';

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 md:flex-row items-start">
      <img
        src={b.kos?.foto?.[0] || FALLBACK_FOTO}
        alt={b.kos?.nama}
        className={`w-full h-32 object-cover rounded-xl border border-slate-100 ${compact ? 'md:w-40' : 'md:w-44'}`}
      />
      <div className="flex-1 min-w-0 space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!compact && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 flex-shrink-0">
                {b.kos?.type || 'CAMPUR'}
              </span>
            )}
            <h3 className="font-heading font-bold text-base text-slate-900 truncate">
              <Link to={`/kos/${b.kosId}`} className="hover:text-emerald-600">{b.kos?.nama}</Link>
            </h3>
          </div>
          <StatusBadge kind="booking" status={b.status} />
        </div>

        <p className="text-slate-500 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span>{b.kos?.alamat}, {b.kos?.kota}</span>
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2 bg-slate-50 p-3 rounded-xl text-slate-700">
          <div>
            <span className="text-slate-400 block text-[10px]">Pilihan Kamar:</span>
            <span className="font-semibold">{b.room?.nomorKamar || 'Kamar Utama'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Mulai Sewa:</span>
            <span className="font-semibold">
              {new Date(b.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Durasi:</span>
            <span className="font-semibold">{b.durasiBulan} Bulan</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Total Biaya:</span>
            <span className="font-bold text-emerald-700 tabular-nums">{formatRupiah(b.totalHarga)}</span>
          </div>
        </div>

        {b.catatan && (
          <p className="text-slate-500 italic text-[11px] bg-slate-50/50 px-2 py-1 rounded">"{b.catatan}"</p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <Link
              to={`/kos/${b.kosId}`}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-emerald-600 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Halaman Kos</span>
            </Link>
            {b.kos?.owner?.phone && (
              <a
                href={`https://wa.me/${b.kos.owner.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${b.kos.owner.name || 'Pemilik'}, saya penyewa ${b.kos.nama}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Pemilik ({b.kos.owner.phone})</span>
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isOpen && (
              <>
                <button
                  type="button"
                  onClick={() => onAgreement(b.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Surat Perjanjian (SPK)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInvoice(b.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-100 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-200"
                >
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                  <span>Kwitansi</span>
                </button>
                {b.extensionRequest?.status === 'PENDING' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Perpanjangan Menunggu Konfirmasi</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onExtend(b)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Perpanjang Sewa</span>
                  </button>
                )}
              </>
            )}
            {canPay && (
              <button
                type="button"
                onClick={() => onPay(b)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Bayar / Kirim Bukti</span>
              </button>
            )}
            {b.status === 'PENDING' && (
              <button
                type="button"
                onClick={() => onCancel(b)}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:text-red-700"
              >
                Batalkan Booking
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TenantDashboardPage() {
  const { user, updateUser, isAuthenticated, isTenant, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab + filter status dari query param, supaya strip, chip, dan tombol
  // back browser memakai satu sumber kebenaran.
  const requestedTab = searchParams.get('tab');
  const activeTab = TAB_KEYS.includes(requestedTab) ? requestedTab : 'ringkasan';
  const requestedStatus = searchParams.get('status');
  const bookingFilter = STATUS_KEYS.includes(requestedStatus) ? requestedStatus : 'ALL';
  const setActiveTab = (tabName) => {
    // Mengganti seluruh query: pindah tab memang harus reset filter.
    setSearchParams({ tab: tabName });
  };
  const setBookingFilter = (status) => setSearchParams({ tab: 'riwayat', status });

  // State
  // Dua status terpisah: kegagalan /payments/tenant tidak boleh membuat riwayat
  // sewa terlihat kosong, dan sebaliknya.
  const [status, setStatus] = useState('loading');
  const [paymentsStatus, setPaymentsStatus] = useState('loading');
  const [loadError, setLoadError] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const reqId = useRef(0);

  // Cancel Booking Modal State
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  // Extension Request State (Phase 14)
  const [extensionModal, setExtensionModal] = useState(null); // booking object
  const [extensionForm, setExtensionForm] = useState({ durasiBulan: 1, catatan: '' });
  const [submittingExtension, setSubmittingExtension] = useState(false);

  // Payment State
  const [payments, setPayments] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null); // booking object
  const [paymentForm, setPaymentForm] = useState({
    metodePembayaran: 'Transfer Bank BCA',
    namaRekening: '',
    nomorRekening: '',
    jumlahTransfer: '',
    catatan: ''
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Digital Agreement & Invoice State (Phase 15)
  const [selectedAgreementBookingId, setSelectedAgreementBookingId] = useState(null);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);


  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    gender: 'Laki-laki',
    occupation: '',
    address: '',
    emergencyContact: '',
    bio: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const toastTimer = useRef(null);
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    // Tanpa clearTimeout, toast berturut-turut menumpuk timer-nya dan pesan
    // pertama bisa hilang lebih cepat (atau tidak pernah) dari 3,5 detik.
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Satu titik refresh untuk seluruh halaman. Nama & signature dipertahankan
  // karena dipanggil setelah bayar, perpanjang, muat demo, dan SPK ditandatangani.
  const fetchDashboardData = async () => {
    const my = ++reqId.current;
    setStatus('loading');
    setPaymentsStatus('loading');

    // /tenant/dashboard sengaja TIDAK dipakai halaman ini: endpoint itu memotong
    // list-nya (tenantController.js:19-23 -> slice(0,5) & slice(0,4)) sehingga
    // angka dan isinya bisa berbeda dari yang dirender, dan server harus
    // menjalankan ulang query yang sama untuk bookings + favorites.
    const [listRes, payRes] = await Promise.allSettled([
      Promise.all([api.get('/tenant/bookings'), api.get('/tenant/favorites')]),
      api.get('/payments/tenant')
    ]);
    if (my !== reqId.current) return; // ada fetch lebih baru; buang hasil basi

    if (listRes.status === 'fulfilled') {
      const [bookRes, favRes] = listRes.value;
      setBookings(Array.isArray(bookRes.data?.data) ? bookRes.data.data : []);
      setFavorites(Array.isArray(favRes.data?.data) ? favRes.data.data : []);
      setStatus('ready');
      setLoadError(null);
    } else {
      console.error('Gagal mengambil data dasbor:', listRes.reason);
      setLoadError(listRes.reason?.response?.data?.message || 'Gagal memuat data dasbor.');
      setStatus('error');
      triggerToast(listRes.reason?.response?.data?.message || 'Gagal memuat data dasbor.', 'error');
    }

    if (payRes.status === 'fulfilled') {
      setPayments(Array.isArray(payRes.value.data?.data) ? payRes.value.data.data : []);
      setPaymentsStatus('ready');
    } else {
      console.error('Gagal mengambil data pembayaran:', payRes.reason);
      setPaymentsStatus('error');
    }
  };

  // Guard peran: hanya mengurus redirect, tidak ikut mengambil data.
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/tenant/dashboard');
      return;
    }
    // /tenant/* di server di-guard authorize('TENANT'), jadi peran lain akan
    // mendapat 403 untuk tiap endpoint di bawah.
    if (!isTenant) {
      navigate('/');
    }
  }, [authLoading, isAuthenticated, isTenant, navigate]);

  // Sekali per sesi tenant. `user` sengaja tidak ikut di deps: menyimpan profil
  // memanggil updateUser() yang mengubah `user`, dan sebelumnya itu membuat
  // seluruh dasbor di-fetch ulang sekaligus menimpa form yang baru disimpan.
  useEffect(() => {
    if (authLoading || !isTenant) return;
    fetchDashboardData();
  }, [authLoading, isTenant]);

  useEffect(() => {
    if (!user) return;
    setProfileForm({
      name: user.name || '',
      phone: user.phone || '',
      gender: user.profile?.gender || 'Laki-laki',
      occupation: user.profile?.occupation || '',
      address: user.profile?.address || '',
      emergencyContact: user.profile?.emergencyContact || '',
      bio: user.profile?.bio || ''
    });
  }, [user]);

  // Handle Submit Payment
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentModal) return;
    try {
      setSubmittingPayment(true);
      const res = await api.post('/payments', {
        bookingId: paymentModal.id,
        ...paymentForm,
        jumlahTransfer: Number(paymentForm.jumlahTransfer)
      });
      if (res.data.success) {
        triggerToast('Bukti pembayaran berhasil dikirim! Menunggu konfirmasi pemilik. 💰', 'success');
        setPaymentModal(null);
        setPaymentForm({ metodePembayaran: 'Transfer Bank BCA', namaRekening: '', nomorRekening: '', jumlahTransfer: '', catatan: '' });
        fetchDashboardData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengirim pembayaran', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Handle Cancel Booking
  const handleConfirmCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancelling(true);
      const res = await api.put(`/tenant/bookings/${cancelModalBooking.id}/cancel`);
      if (res.data.success) {
        triggerToast('Pengajuan booking berhasil dibatalkan.', 'success');
        // Update local booking list — angka strip ikut berubah sendiri karena
        // diturunkan dari `bookings`, tidak lagi di-decrement manual.
        setBookings(prev => prev.map(b => b.id === cancelModalBooking.id ? { ...b, status: 'CANCELLED' } : b));
        setCancelModalBooking(null);
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal membatalkan booking.', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Submit Extension Request (Phase 14)
  const handleSubmitExtension = async (e) => {
    e.preventDefault();
    if (!extensionModal) return;
    try {
      setSubmittingExtension(true);
      const res = await api.post(`/tenant/bookings/${extensionModal.id}/extend`, {
        durasiBulan: Number(extensionForm.durasiBulan),
        catatan: extensionForm.catatan
      });
      if (res.data.success) {
        triggerToast('Pengajuan perpanjangan sewa berhasil dikirim ke pemilik kos! 🔄', 'success');
        setExtensionModal(null);
        setExtensionForm({ durasiBulan: 1, catatan: '' });
        fetchDashboardData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengajukan perpanjangan sewa.', 'error');
    } finally {
      setSubmittingExtension(false);
    }
  };

  // Handle Remove Favorite
  const handleRemoveFavorite = async (kosId, kosNama) => {
    try {
      const res = await api.delete(`/tenant/favorites/${kosId}`);
      if (res.data.success) {
        setFavorites(prev => prev.filter(f => f.kosId !== kosId));
        triggerToast(`${kosNama || 'Kos'} dihapus dari favorit`, 'success');
      }
    } catch (err) {
      triggerToast('Gagal menghapus kos dari favorit', 'error');
    }
  };

  // Handle Load Demo Data (Untuk kemudahan pengujian akun kosong / owner)
  const handleLoadDemoData = async () => {
    try {
      setStatus('loading');
      await api.post('/tenant/bookings', {
        kosId: 'kos-01',
        durasiBulan: 6,
        totalHarga: 4500000,
        catatan: 'Pengajuan sewa demo kamar kos.'
      });
      await api.post('/tenant/bookings', {
        kosId: 'kos-04',
        durasiBulan: 3,
        totalHarga: 2550000,
        catatan: 'Pengajuan sewa kamar 01 untuk adik tingkat.'
      });
      await api.post('/tenant/favorites/kos-02').catch(() => {});
      await api.post('/tenant/favorites/kos-03').catch(() => {});
      triggerToast('Data simulasi booking dan favorit berhasil dimuat!', 'success');
      await fetchDashboardData();
    } catch (err) {
      triggerToast('Gagal memuat data simulasi', 'error');
      setStatus('error');
    }
  };

  // Handle Profile Update
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      const res = await api.put('/tenant/profile', profileForm);
      if (res.data.success) {
        updateUser(res.data.data);
        triggerToast('Profil Anda berhasil diperbarui!', 'success');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal memperbarui profil', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Angka strip diturunkan dari list yang sama yang dirender halaman ini, jadi
  // tidak mungkin berbeda dari yang dilihat penyewa.
  const stats = useMemo(() => ({
    totalBookings: bookings.length,
    activeBookings: bookings.filter(b => b.status === 'APPROVED').length,
    pendingBookings: bookings.filter(b => b.status === 'PENDING').length,
    completedBookings: bookings.filter(b => b.status === 'COMPLETED').length,
    totalFavorites: favorites.length
  }), [bookings, favorites]);

  // Konvensi tanggal akhir sama dengan server (db.js:1734-1737): tanggalMulai
  // ditambah durasiBulan.
  const activeBooking = bookings.find(b => b.status === 'APPROVED' || b.status === 'COMPLETED');
  const contextLine = (() => {
    if (status === 'loading') return 'Memuat data Anda…';
    if (status === 'error') return 'Data gagal dimuat. Coba lagi lewat tombol di bawah.';
    if (activeBooking) {
      const end = new Date(activeBooking.tanggalMulai);
      end.setMonth(end.getMonth() + Number(activeBooking.durasiBulan || 1));
      return `Sewa berjalan di ${activeBooking.kos?.nama || 'kos Anda'} — berakhir ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}.`;
    }
    if (bookings.length) return 'Semua pengajuan sudah punya keputusan. Belum ada sewa berjalan.';
    return 'Belum ada pengajuan sewa di akun ini.';
  })();

  // Satu segmen = satu angka = satu filter. Yang nol dibuang: "0 pengajuan ·
  // 0 aktif · 0 favorit" bukan ringkasan, cuma kebisingan.
  const segments = [
    { key: 'pengajuan', value: bookings.length, label: 'pengajuan', to: '/tenant/dashboard?tab=riwayat' },
    { key: 'aktif', value: stats.activeBookings, label: 'aktif', to: '/tenant/dashboard?tab=riwayat&status=APPROVED' },
    { key: 'menunggu', value: stats.pendingBookings, label: 'menunggu', to: '/tenant/dashboard?tab=riwayat&status=PENDING', accent: true },
    { key: 'selesai', value: stats.completedBookings, label: 'selesai', to: '/tenant/dashboard?tab=riwayat&status=COMPLETED' },
    { key: 'favorit', value: favorites.length, label: 'favorit', to: '/tenant/dashboard?tab=favorit' },
    { key: 'pembayaran', value: payments.length, label: 'pembayaran', to: '/tenant/dashboard?tab=pembayaran' }
  ].filter(s => s.value > 0);

  // Pengajuan yang masih layak dikirim bukti. Dipakai guard DAN isi form tombol
  // "Kirim Bukti" supaya keduanya tidak bisa berbeda — sebelumnya guard menerima
  // APPROVED|PENDING tapi form diisi `find(APPROVED) || bookings[0]`, sehingga
  // booking terbaru yang sudah BATAL/DITOLAK bisa membuka form dengan nominal
  // dari sewa yang mati.
  const payableBookings = bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING');

  const openPaymentModal = (b) => {
    setPaymentModal(b);
    setPaymentForm({
      metodePembayaran: 'Transfer Bank BCA',
      namaRekening: user?.name || '',
      nomorRekening: '',
      jumlahTransfer: b.totalHarga || '',
      catatan: `Pembayaran sewa ${b.kos?.nama} (${b.durasiBulan} bulan)`
    });
  };
  const openExtensionModal = (b) => {
    setExtensionModal(b);
    setExtensionForm({ durasiBulan: 1, catatan: '' });
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'ALL') return true;
    return b.status === bookingFilter;
  });


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 max-w-[min(92vw,22rem)]">
          <div className={`flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-red-600" /> : <CheckCircle className="mt-0.5 w-4 h-4 flex-shrink-0 text-emerald-600" />}
            <span className="break-words">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header ringkas — tanpa kartu, gradien, blob, badge, dan emoji. Aksi
          sengaja nol: /chat dan /cari sudah hidup di nav desktop maupun bar
          bawah mobile, jadi menaruhnya lagi di sini cuma duplikasi. */}
      <div className="mb-5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Halo, {user?.name?.split(' ')[0] || 'Pencari Kos'}
        </h1>
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-500">{contextLine}</p>
      </div>

      {/* Helper Banner pengisi data contoh — hanya untuk mempercepat uji lokal */}
      {SHOW_DEMO_TOOLS && status === 'ready' && bookings.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-900">Dashboard Anda Saat Ini Masih Kosong</h4>
              <p className="text-xs text-amber-700 mt-0.5">
                {user?.role === 'OWNER'
                  ? `Akun "${user.name}" terdaftar sebagai Pemilik Kos (Owner), sehingga belum memiliki riwayat sewa.`
                  : 'Anda belum mengajukan sewa kos atau menyimpan kos favorit di akun ini.'}{' '}
                Klik tombol di samping untuk langsung mengisi data contoh booking & kos favorit!
              </p>
            </div>
          </div>
          <button
            onClick={handleLoadDemoData}
            className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Muat Data Contoh (Demo)</span>
          </button>
        </div>
      )}

      {/* Strip status: satu angka = satu filter, tiap segmen tautan nyata supaya
          bisa di-tap, di-keyboard, dan di-back. Saat gagal tidak dirender di sini
          — panel di bawah sudah menampilkan "Data gagal dimuat". */}
      {status === 'loading' && (
        <div aria-hidden="true" className="mb-8 flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1.5">
          {[0, 1, 2, 3].map(i => <span key={i} className="h-9 w-20 animate-pulse rounded-lg bg-slate-200" />)}
        </div>
      )}
      {status === 'ready' && segments.length > 0 && (
        <nav aria-label="Ringkasan status" className="mb-8 w-fit max-w-full rounded-2xl border border-slate-200 bg-white p-1.5">
          <ul className="flex flex-wrap items-stretch gap-1">
            {segments.map((s) => (
              <li key={s.key}>
                <Link
                  to={s.to}
                  className={`group flex h-full items-baseline gap-1.5 rounded-lg px-2.5 py-2 transition-colors ${
                    s.accent ? 'bg-amber-50 ring-1 ring-amber-200 hover:bg-amber-100' : 'hover:bg-slate-100'
                  }`}
                >
                  <span className={`font-heading text-base font-bold leading-none tabular-nums ${s.accent ? 'text-amber-900' : 'text-slate-900'}`}>
                    {s.value}
                  </span>
                  {/* slate-500 di atas slate-50 lolos 4,5:1 tapi di atas slate-100
                      (latar hover) jatuh ke 4,34:1, jadi labelnya ikut menggelap. */}
                  <span className={`text-xs ${s.accent ? 'text-amber-800' : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {s.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* Tabs Navigation — sama seperti dasbor pemilik: sticky di bawah navbar,
          indikator garis bawah, tanpa angka. Angka sudah dimiliki strip status dan
          chip filter, jadi tab cukup menandai tempat. */}
      <div className="sticky top-16 z-30 -mx-4 mb-8 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto no-scrollbar px-4">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-current={activeTab === t.key ? "page" : undefined}
              onClick={() => setActiveTab(t.key)}
              className={`whitespace-nowrap border-b-2 px-3 py-3 text-xs font-semibold transition-colors ${
                activeTab === t.key
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: 1. RINGKASAN (OVERVIEW) */}
      {activeTab === 'ringkasan' && (
        <PanelState status={status} error={loadError} onRetry={fetchDashboardData}>
        <div className="space-y-8">
          {bookings.length > 0 ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-4">
                <h3 className="font-heading text-sm font-bold text-slate-900">Pengajuan terbaru</h3>
                <Link
                  to="/tenant/dashboard?tab=riwayat"
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Lihat semua ({bookings.length})
                </Link>
              </div>
              <BookingCard
                booking={bookings[0]}
                compact
                onAgreement={setSelectedAgreementBookingId}
                onInvoice={setSelectedInvoiceBookingId}
                onExtend={openExtensionModal}
                onPay={openPaymentModal}
                onCancel={setCancelModalBooking}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
              <Calendar className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <h3 className="font-heading mb-1 text-sm font-bold text-slate-800">Belum ada pengajuan sewa</h3>
              <p className="mx-auto mb-5 max-w-sm text-xs text-slate-500">
                Telusuri kamar kos berdasarkan lokasi, harga, dan fasilitas di kota tujuan Anda.
              </p>
              <Link
                to="/cari"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <span>Mulai cari kos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
        </PanelState>
      )}

      {/* TAB CONTENT: 2. RIWAYAT BOOKING */}
      {activeTab === 'riwayat' && (
        <PanelState status={status} error={loadError} onRetry={fetchDashboardData}>
        <div className="space-y-6">
          {/* Filter Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: 'ALL', label: 'Semua Status' },
              { key: 'PENDING', label: 'Menunggu Konfirmasi' },
              { key: 'APPROVED', label: 'Disetujui' },
              { key: 'COMPLETED', label: 'Selesai / Lunas' },
              { key: 'CANCELLED', label: 'Dibatalkan' },
              { key: 'REJECTED', label: 'Ditolak' }
            ].map(f => (
              <button
                key={f.key}
                onClick={() => setBookingFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  bookingFilter === f.key
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <BookingCard
                  booking={b}
                  onAgreement={setSelectedAgreementBookingId}
                  onInvoice={setSelectedInvoiceBookingId}
                  onExtend={openExtensionModal}
                  onPay={openPaymentModal}
                  onCancel={setCancelModalBooking}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-slate-800 text-sm mb-1">
                Tidak ada riwayat booking dengan status "{bookingFilter}"
              </h3>
              <p className="text-xs text-slate-500 mb-4">Coba ubah filter atau ajukan sewa kos baru.</p>
              {bookings.length === 0 ? (
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/cari"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Mulai cari kos
                  </Link>
                </div>
              ) : (
                <button
                  onClick={() => setBookingFilter('ALL')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl mr-2"
                >
                  Tampilkan Semua
                </button>
              )}
            </div>
          )}
        </div>
        </PanelState>
      )}

      {/* TAB CONTENT: 3. KOS FAVORIT */}
      {activeTab === 'favorit' && (
        <PanelState status={status} error={loadError} onRetry={fetchDashboardData}>
        <div>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors hover:border-slate-300"
                >
                  <div className="relative">
                    <img
                      src={fav.kos?.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                      alt={fav.kos?.nama}
                      className="w-full h-44 object-cover"
                    />
                    <button
                      onClick={() => handleRemoveFavorite(fav.kosId, fav.kos?.nama)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm text-rose-500 hover:bg-rose-50 flex items-center justify-center shadow transition-colors"
                      title="Hapus dari favorit"
                    >
                      <Heart className="w-4 h-4 fill-rose-500" />
                    </button>
                    <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/70 backdrop-blur-sm text-white">
                      {fav.kos?.type || 'CAMPUR'}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-heading font-bold text-sm text-slate-900 line-clamp-1 mb-1">
                        {fav.kos?.nama}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fav.kos?.kota}</span>
                      </p>
                      <p className="text-sm font-extrabold text-emerald-700">
                        {formatRupiah(fav.kos?.hargaBulanan)}{' '}
                        <span className="text-xs font-normal text-slate-400">/bulan</span>
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center gap-2 mt-3">
                      <Link
                        to={`/kos/${fav.kosId}`}
                        className="flex-1 text-center py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                      >
                        Lihat Detail
                      </Link>
                      <button
                        onClick={() => handleRemoveFavorite(fav.kosId, fav.kos?.nama)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                        title="Hapus favorit"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-800 mb-1">Daftar Favorit Masih Kosong</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                Simpan kos favorit Anda agar mudah dibandingkan atau dilihat kembali di kemudian hari.
              </p>
              <Link
                to="/cari"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                <span>Cari Kos Impian</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
        </PanelState>
      )}

      {/* TAB CONTENT: 4. PROFIL SAYA */}
      {activeTab === 'profil' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || 'Tenant')}`}
              alt={user?.name}
              className="w-16 h-16 rounded-full border-2 border-emerald-500/20 object-cover bg-slate-100"
            />
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">{user?.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{user?.email}</span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Akun Terverifikasi
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor WhatsApp / HP</label>
                <input
                  type="tel"
                  placeholder="081234567890"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Kelamin</label>
                <select
                  value={profileForm.gender}
                  onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pekerjaan / Status</label>
                <input
                  type="text"
                  placeholder="Contoh: Mahasiswa Unsoed / Karyawan"
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm({ ...profileForm, occupation: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kota Asal / Alamat KTP</label>
                <input
                  type="text"
                  placeholder="Contoh: Tegal, Jawa Tengah"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kontak Darurat (Ortu/Keluarga)</label>
                <input
                  type="text"
                  placeholder="Contoh: 081299887766 (Ibu)"
                  value={profileForm.emergencyContact}
                  onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bio Singkat</label>
              <textarea
                rows="3"
                placeholder="Ceritakan sedikit tentang Anda agar pemilik kos lebih mudah mengenal calon penyewa..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB CONTENT: 5. PEMBAYARAN (PAYMENT HISTORY & STATUS) */}
      {activeTab === 'pembayaran' && (
        <PanelState status={paymentsStatus} onRetry={fetchDashboardData}>
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <span>Riwayat & Status Pembayaran Sewa</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau status verifikasi pembayaran transfer dan konfirmasi dari pemilik kos.
                </p>
              </div>
              {payableBookings.length > 0 && (
                <button
                  onClick={() => {
                    openPaymentModal(payableBookings[0]);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>+ Kirim Bukti Pembayaran Baru</span>
                </button>
              )}
            </div>

            {payments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">Belum Ada Riwayat Pembayaran</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Setelah pengajuan booking Anda disetujui pemilik kos, Anda dapat mengirim bukti transfer di sini.
                </p>
                {bookings.length > 0 && (
                  <button
                    onClick={() => setActiveTab('riwayat')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    Lihat Booking Saya
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {payments.map(p => (
                  <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-300 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{p.kos?.nama || 'Kos'}</span>
                          <StatusBadge kind="payment" status={p.status} />
                        </div>
                        <p className="text-xs text-slate-500">{p.kos?.kota} • Metode: <strong className="text-slate-700">{p.metodePembayaran}</strong></p>
                        <p className="text-xs text-slate-500">
                          Rekening Pengirim: <span className="font-medium text-slate-700">{p.namaRekening}</span> ({p.nomorRekening || '-'})
                        </p>
                        {p.catatan && (
                          <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1">
                            Catatan: "{p.catatan}"
                          </p>
                        )}
                        {p.alasanPenolakan && (
                          <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mt-1 font-medium">
                            Alasan penolakan: {p.alasanPenolakan}
                          </p>
                        )}
                      </div>

                      <div className="text-right sm:min-w-[140px] pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 flex sm:flex-col justify-between items-end">
                        <span className="text-xs text-slate-400">Total Ditransfer:</span>
                        <span className="text-base font-extrabold text-emerald-700">{formatRupiah(p.jumlahTransfer)}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </PanelState>
      )}

      {/* SUBMIT PAYMENT MODAL */}
      {paymentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">Kirim Bukti Pembayaran</h3>
                  <p className="text-[11px] text-slate-400">{paymentModal.kos?.nama} ({paymentModal.durasiBulan} Bulan)</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-emerald-800">Nominal Tagihan Sewa:</span>
                <span className="font-extrabold text-emerald-700 text-sm">{formatRupiah(paymentModal.totalHarga)}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilihan Metode Pembayaran *</label>
                <select
                  value={paymentForm.metodePembayaran}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, metodePembayaran: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="Transfer Bank BCA">Transfer Bank BCA (Virtual / Manual)</option>
                  <option value="Transfer Bank Mandiri">Transfer Bank Mandiri</option>
                  <option value="Transfer Bank BRI">Transfer Bank BRI</option>
                  <option value="Transfer Bank BNI">Transfer Bank BNI</option>
                  <option value="E-Wallet GoPay">E-Wallet GoPay</option>
                  <option value="E-Wallet OVO">E-Wallet OVO</option>
                  <option value="E-Wallet DANA">E-Wallet DANA</option>
                  <option value="Tunai / Cash Langsung">Tunai / Cash Langsung ke Pemilik</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Pemilik Rekening Pengirim *</label>
                  <input
                    type="text"
                    value={paymentForm.namaRekening}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, namaRekening: e.target.value }))}
                    placeholder="Contoh: Rian Pratama"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Rekening / No. HP *</label>
                  <input
                    type="text"
                    value={paymentForm.nomorRekening}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, nomorRekening: e.target.value }))}
                    placeholder="Contoh: 1234567890"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Transfer (Rp) *</label>
                <input
                  type="number"
                  value={paymentForm.jumlahTransfer}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, jumlahTransfer: e.target.value }))}
                  placeholder="Contoh: 4500000"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold text-emerald-700"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  value={paymentForm.catatan}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, catatan: e.target.value }))}
                  rows={2}
                  placeholder="Misal: Sudah ditransfer via m-banking pukul 14.30 WIB..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModal(null)}
                  disabled={submittingPayment}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingPayment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim Bukti Pembayaran</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXTENSION REQUEST MODAL (Phase 14) */}
      {extensionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">Ajukan Perpanjangan Sewa</h3>
                  <p className="text-[11px] text-slate-400">{extensionModal.kos?.nama} — Kamar {extensionModal.room?.nomorKamar || 'Utama'}</p>
                </div>
              </div>
              <button
                onClick={() => setExtensionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitExtension} className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-800 space-y-1">
                <div className="flex justify-between">
                  <span>Durasi Sewa Saat Ini:</span>
                  <span className="font-bold">{extensionModal.durasiBulan} Bulan</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Biaya Sekarang:</span>
                  <span className="font-bold">{formatRupiah(extensionModal.totalHarga)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Perpanjangan (Bulan) *</label>
                <select
                  value={extensionForm.durasiBulan}
                  onChange={(e) => setExtensionForm(prev => ({ ...prev, durasiBulan: e.target.value }))}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  required
                >
                  {[1, 2, 3, 6, 12].map(n => (
                    <option key={n} value={n}>{n} Bulan</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan untuk Pemilik (Opsional)</label>
                <textarea
                  value={extensionForm.catatan}
                  onChange={(e) => setExtensionForm(prev => ({ ...prev, catatan: e.target.value }))}
                  rows={2}
                  placeholder="Misal: Saya ingin memperpanjang karena semester depan masih kuliah di sini..."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExtensionModal(null)}
                  disabled={submittingExtension}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingExtension}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingExtension ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  <span>Ajukan Perpanjangan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL BOOKING MODAL */}
      {cancelModalBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
              Batalkan Pengajuan Booking?
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Apakah Anda yakin ingin membatalkan pengajuan sewa untuk <strong>{cancelModalBooking.kos?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-600 mb-6">
              <div className="flex justify-between">
                <span>Durasi Sewa:</span>
                <span className="font-semibold">{cancelModalBooking.durasiBulan} Bulan</span>
              </div>
              <div className="flex justify-between">
                <span>Total Biaya:</span>
                <span className="font-semibold text-emerald-700">{formatRupiah(cancelModalBooking.totalHarga)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Tutup
              </button>
              <button
                onClick={handleConfirmCancelBooking}
                disabled={cancelling}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Ya, Batalkan Booking</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENTAL AGREEMENT MODAL (SPK) */}
      {selectedAgreementBookingId && (
        <RentalAgreementModal
          bookingId={selectedAgreementBookingId}
          currentUser={user}
          onClose={() => setSelectedAgreementBookingId(null)}
          onSigned={() => {
            fetchDashboardData();
          }}
        />
      )}

      {/* OFFICIAL INVOICE & KWITANSI MODAL */}
      {selectedInvoiceBookingId && (
        <OfficialInvoiceModal
          bookingId={selectedInvoiceBookingId}
          onClose={() => setSelectedInvoiceBookingId(null)}
        />
      )}
    </div>
  );
}
