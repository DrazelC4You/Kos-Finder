import React, { useState, useEffect } from 'react';
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

export default function TenantDashboardPage() {
  const { user, updateUser, isAuthenticated, isTenant, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab from query param (default: 'ringkasan')
  const activeTab = searchParams.get('tab') || 'ringkasan';
  const setActiveTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // State
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    pendingBookings: 0,
    totalFavorites: 0
  });
  const [bookings, setBookings] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('ALL');

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

  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [dashRes, bookRes, favRes, payRes] = await Promise.all([
        api.get('/tenant/dashboard'),
        api.get('/tenant/bookings'),
        api.get('/tenant/favorites'),
        api.get('/payments/tenant').catch(() => ({ data: { data: [] } }))
      ]);

      if (dashRes.data.success) setStats(dashRes.data.data.stats || stats);
      if (bookRes.data.success) setBookings(bookRes.data.data || []);
      if (favRes.data.success) setFavorites(favRes.data.data || []);
      setPayments(payRes.data?.data || []);
    } catch (err) {
      console.error('Gagal mengambil data dashboard:', err);
      triggerToast(err.response?.data?.message || 'Gagal memuat data dashboard.', 'error');
    } finally {
      setLoading(false);
    }
  };

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
      return;
    }
    fetchDashboardData();

    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.profile?.gender || 'Laki-laki',
        occupation: user.profile?.occupation || '',
        address: user.profile?.address || '',
        emergencyContact: user.profile?.emergencyContact || '',
        bio: user.profile?.bio || ''
      });
    }
  }, [isAuthenticated, isTenant, user, authLoading]);

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
        // Update local booking list
        setBookings(prev => prev.map(b => b.id === cancelModalBooking.id ? { ...b, status: 'CANCELLED' } : b));
        // Refresh metrics
        setStats(prev => ({
          ...prev,
          pendingBookings: Math.max(0, prev.pendingBookings - 1)
        }));
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
        setStats(prev => ({ ...prev, totalFavorites: Math.max(0, prev.totalFavorites - 1) }));
        triggerToast(`${kosNama || 'Kos'} dihapus dari favorit`, 'success');
      }
    } catch (err) {
      triggerToast('Gagal menghapus kos dari favorit', 'error');
    }
  };

  // Handle Load Demo Data (Untuk kemudahan pengujian akun kosong / owner)
  const handleLoadDemoData = async () => {
    try {
      setLoading(true);
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
      triggerToast('Data simulasi booking dan favorit berhasil dimuat! 🎉', 'success');
      await fetchDashboardData();
    } catch (err) {
      triggerToast('Gagal memuat data simulasi', 'error');
    } finally {
      setLoading(false);
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

  // Filtered Bookings
  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'ALL') return true;
    return b.status === bookingFilter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Disetujui / Aktif
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Menunggu Konfirmasi
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            Ditolak
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Dibatalkan
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-600" /> : <CheckCircle className="w-4 h-4 text-emerald-600" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-800 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold mb-3 border border-white/10 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Portal Pencari Kos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-white">
              Halo, {user?.name || 'Pencari Kos'}! 👋
            </h1>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-xl">
              Pantau status pengajuan sewa kos Anda, kelola kos favorit, dan perbarui profil penyewa dengan mudah.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl border border-emerald-500/30 transition-all shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-300" />
              <span>Buka Pesan & Chat</span>
            </Link>
            <Link
              to="/cari"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-bold rounded-xl shadow transition-all duration-150"
            >
              <span>Jelajahi Kos Lainnya</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Helper Banner pengisi data contoh — hanya untuk mempercepat uji lokal */}
      {SHOW_DEMO_TOOLS && bookings.length === 0 && !loading && (
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

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div
          onClick={() => { setActiveTab('riwayat'); setBookingFilter('ALL'); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Booking</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-slate-900">
            {loading ? '...' : stats.totalBookings}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Semua riwayat pengajuan</p>
        </div>

        <div
          onClick={() => { setActiveTab('riwayat'); setBookingFilter('APPROVED'); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Disetujui</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-emerald-600">
            {loading ? '...' : stats.activeBookings}
          </div>
          <p className="text-[11px] text-emerald-700/70 mt-1">Sewa aktif / terkonfirmasi</p>
        </div>

        <div
          onClick={() => { setActiveTab('riwayat'); setBookingFilter('PENDING'); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Menunggu Respon</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-amber-600">
            {loading ? '...' : stats.pendingBookings}
          </div>
          <p className="text-[11px] text-amber-700/70 mt-1">Menunggu approval pemilik</p>
        </div>

        <div
          onClick={() => setActiveTab('favorit')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-rose-300 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kos Favorit</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-heading font-extrabold text-rose-600">
            {loading ? '...' : stats.totalFavorites}
          </div>
          <p className="text-[11px] text-rose-700/70 mt-1">Kos tersimpan di wishlist</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar gap-2">
        <button
          onClick={() => setActiveTab('ringkasan')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'ringkasan'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Ringkasan
        </button>
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'riwayat'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Riwayat Booking ({bookings.length})
        </button>
        <button
          onClick={() => setActiveTab('favorit')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'favorit'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Kos Favorit ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab('profil')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
            activeTab === 'profil'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Profil Saya
        </button>
        <button
          onClick={() => setActiveTab('pembayaran')}
          className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'pembayaran'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Pembayaran ({payments.length})
        </button>
      </div>

      {/* TAB CONTENT: 1. RINGKASAN (OVERVIEW) */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-8">
          {/* Latest Booking Banner */}
          {bookings.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <h3 className="font-heading font-bold text-base text-slate-900">Pengajuan Booking Terbaru</h3>
                </div>
                {getStatusBadge(bookings[0].status)}
              </div>

              <div className="flex flex-col md:flex-row gap-5 items-start">
                <img
                  src={bookings[0].kos?.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                  alt={bookings[0].kos?.nama}
                  className="w-full md:w-48 h-32 object-cover rounded-xl border border-slate-100"
                />
                <div className="flex-1 space-y-2 text-xs text-slate-600">
                  <h4 className="font-heading font-bold text-base text-slate-900">
                    <Link to={`/kos/${bookings[0].kosId}`} className="hover:text-emerald-600">
                      {bookings[0].kos?.nama}
                    </Link>
                  </h4>
                  <p className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{bookings[0].kos?.alamat}, {bookings[0].kos?.kota}</span>
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Kamar:</span>
                      <span className="font-semibold">{bookings[0].room?.nomorKamar || 'Kamar Standar'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Durasi Sewa:</span>
                      <span className="font-semibold">{bookings[0].durasiBulan} Bulan</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total Biaya:</span>
                      <span className="font-bold text-emerald-700">{formatRupiah(bookings[0].totalHarga)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      to={`/kos/${bookings[0].kosId}`}
                      className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
                    >
                      <span>Lihat Detail Kos</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>

                    {bookings[0].status === 'PENDING' && (
                      <button
                        onClick={() => setCancelModalBooking(bookings[0])}
                        className="text-red-600 hover:text-red-700 font-semibold text-xs ml-auto"
                      >
                        Batalkan Pengajuan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-800 mb-1">Belum Ada Pengajuan Sewa</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                {SHOW_DEMO_TOOLS
                  ? 'Temukan kamar kos impian Anda di berbagai kota, atau klik tombol di bawah untuk memuat data pengujian otomatis.'
                  : 'Temukan kamar kos impian Anda di berbagai kota.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {SHOW_DEMO_TOOLS && (
                  <button
                    type="button"
                    onClick={handleLoadDemoData}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Muat Data Contoh (Demo)</span>
                  </button>
                )}
                <Link
                  to="/cari"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
                >
                  <span>Mulai Cari Kos Sekarang</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Quick Saved Favorites */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-slate-900">Kos Favorit Terakhir Disimpan</h3>
              <button
                onClick={() => setActiveTab('favorit')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Lihat Semua ({favorites.length})
              </button>
            </div>

            {favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {favorites.slice(0, 2).map((fav) => (
                  <div key={fav.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-4 items-center shadow-sm">
                    <img
                      src={fav.kos?.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400'}
                      alt={fav.kos?.nama}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">{fav.kos?.type}</span>
                      <h4 className="font-heading font-bold text-sm text-slate-900 truncate">
                        <Link to={`/kos/${fav.kosId}`} className="hover:text-emerald-600">
                          {fav.kos?.nama}
                        </Link>
                      </h4>
                      <p className="text-xs text-slate-500 truncate">{fav.kos?.kota}</p>
                      <p className="text-xs font-bold text-emerald-700 mt-1">
                        {formatRupiah(fav.kos?.hargaBulanan)} <span className="font-normal text-slate-400 text-[10px]">/bln</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 bg-white border border-slate-200 p-6 rounded-2xl text-center">
                Belum ada kos yang ditandai sebagai favorit. Klik tombol hati pada kos yang Anda sukai!
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. RIWAYAT BOOKING */}
      {activeTab === 'riwayat' && (
        <div className="space-y-6">
          {/* Filter Sub-Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { key: 'ALL', label: 'Semua Status' },
              { key: 'PENDING', label: 'Menunggu Konfirmasi' },
              { key: 'APPROVED', label: 'Disetujui' },
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
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row gap-5 items-start"
                >
                  <img
                    src={b.kos?.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=500'}
                    alt={b.kos?.nama}
                    className="w-full md:w-44 h-32 object-cover rounded-xl border border-slate-100"
                  />
                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {b.kos?.type || 'CAMPUR'}
                        </span>
                        <h3 className="font-heading font-bold text-base text-slate-900">
                          <Link to={`/kos/${b.kosId}`} className="hover:text-emerald-600">
                            {b.kos?.nama}
                          </Link>
                        </h3>
                      </div>
                      {getStatusBadge(b.status)}
                    </div>

                    <p className="text-slate-500 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
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
                        <span className="font-bold text-emerald-700">{formatRupiah(b.totalHarga)}</span>
                      </div>
                    </div>

                    {b.catatan && (
                      <p className="text-slate-500 italic text-[11px] bg-slate-50/50 px-2 py-1 rounded">
                        "{b.catatan}"
                      </p>
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
                        {b.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => setSelectedAgreementBookingId(b.id)}
                              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 shadow-sm transition-colors inline-flex items-center gap-1.5"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Surat Perjanjian (SPK)</span>
                            </button>

                            <button
                              onClick={() => setSelectedInvoiceBookingId(b.id)}
                              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 shadow-sm transition-colors inline-flex items-center gap-1.5"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-700" />
                              <span>Kwitansi</span>
                            </button>

                            {b.extensionRequest?.status === 'PENDING' ? (
                              <span className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Perpanjangan Menunggu Konfirmasi</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  setExtensionModal(b);
                                  setExtensionForm({ durasiBulan: 1, catatan: '' });
                                }}
                                className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Perpanjang Sewa</span>
                              </button>
                            )}
                          </>
                        )}
                        {(b.status === 'APPROVED' || b.status === 'PENDING') && (
                          <button
                            onClick={() => {
                              setPaymentModal(b);
                              setPaymentForm({
                                metodePembayaran: 'Transfer Bank BCA',
                                namaRekening: user?.name || '',
                                nomorRekening: '',
                                jumlahTransfer: b.totalHarga || '',
                                catatan: `Pembayaran sewa ${b.kos?.nama} (${b.durasiBulan} bulan)`
                              });
                            }}
                            className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Bayar / Kirim Bukti</span>
                          </button>
                        )}
                        {b.status === 'PENDING' && (
                          <button
                            onClick={() => setCancelModalBooking(b)}
                            className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
                          >
                            Batalkan Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
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
                  {SHOW_DEMO_TOOLS && (
                    <button
                      type="button"
                      onClick={handleLoadDemoData}
                      className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition-all inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Muat Data Contoh (Demo)</span>
                    </button>
                  )}
                  <Link
                    to="/cari"
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm"
                  >
                    Mulai Cari Kos Sekarang
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
      )}

      {/* TAB CONTENT: 3. KOS FAVORIT */}
      {activeTab === 'favorit' && (
        <div>
          {favorites.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
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
      )}

      {/* TAB CONTENT: 4. PROFIL SAYA */}
      {activeTab === 'profil' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
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
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
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
              {bookings.filter(b => b.status === 'APPROVED' || b.status === 'PENDING').length > 0 && (
                <button
                  onClick={() => {
                    const b = bookings.find(x => x.status === 'APPROVED') || bookings[0];
                    if (b) {
                      setPaymentModal(b);
                      setPaymentForm({
                        metodePembayaran: 'Transfer Bank BCA',
                        namaRekening: user?.name || '',
                        nomorRekening: '',
                        jumlahTransfer: b.totalHarga || '',
                        catatan: `Pembayaran sewa ${b.kos?.nama}`
                      });
                    }
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
                  <div key={p.id} className="border border-slate-200 rounded-xl p-4 sm:p-5 hover:border-emerald-200 transition-all bg-white shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{p.kos?.nama || 'Kos'}</span>
                          {p.status === 'CONFIRMED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Dikonfirmasi (Lunas)
                            </span>
                          )}
                          {p.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Menunggu Verifikasi Pemilik
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                              <CircleX className="w-3.5 h-3.5 text-rose-600" />
                              Ditolak
                            </span>
                          )}
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
