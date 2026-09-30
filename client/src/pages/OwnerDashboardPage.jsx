import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building, Bed, CheckCircle, Clock, XCircle, AlertCircle,
  Plus, Edit, Trash2, ExternalLink, MessageSquare, DollarSign,
  Key, Loader2, Save, X, Eye,
  Star, CornerDownRight, MessageCircle, CreditCard, Wallet,
  TrendingUp, CircleX, BadgeCheck,
  FileText, Receipt, ImagePlus, Link2, MailWarning
} from 'lucide-react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah } from '../components/KosCard.jsx';
import RentalAgreementModal from '../components/RentalAgreementModal.jsx';
import OfficialInvoiceModal from '../components/OfficialInvoiceModal.jsx';

const ALL_FACILITIES = [
  'WiFi', 'AC', 'Kamar mandi dalam', 'Kasur', 'Lemari',
  'Meja & Kursi', 'Parkir Motor', 'Parkir Mobil', 'Dapur Bersama',
  'Akses 24 Jam', 'CCTV', 'Mesin Cuci'
];

export default function OwnerDashboardPage() {
  const { user, isAuthenticated, isOwner, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'ringkasan';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // State Data
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    pendingBookings: 0,
    approvedBookings: 0,
    estimatedMonthlyRevenue: 0
  });
  const [kosList, setKosList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [selectedKosForRooms, setSelectedKosForRooms] = useState('');

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedReviewForReply, setSelectedReviewForReply] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Payments State (Phase 12)
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [processingPaymentId, setProcessingPaymentId] = useState(null);
  const [rejectModalPayment, setRejectModalPayment] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Digital Agreement & Invoice State (Phase 15)
  const [selectedAgreementBookingId, setSelectedAgreementBookingId] = useState(null);
  const [selectedInvoiceBookingId, setSelectedInvoiceBookingId] = useState(null);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const triggerToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Email Verification (anti-troll gate untuk owner baru)
  const [resendingVerification, setResendingVerification] = useState(false);
  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const res = await api.post('/auth/resend-verification');
      triggerToast(res.data.message || 'Tautan verifikasi baru telah dikirim ke email Anda.');
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengirim ulang email verifikasi.', 'error');
    } finally {
      setResendingVerification(false);
    }
  };

  // Modal State: Add/Edit Kos
  const [kosModalOpen, setKosModalOpen] = useState(false);
  const [editingKosId, setEditingKosId] = useState(null);
  const [savingKos, setSavingKos] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photoUrlInput, setPhotoUrlInput] = useState('');
  const [kosForm, setKosForm] = useState({
    nama: '',
    deskripsi: '',
    alamat: '',
    kota: 'Purwokerto',
    hargaBulanan: '',
    type: 'CAMPUR',
    foto: [],
    fasilitas: ['WiFi', 'Kasur', 'Lemari'],
    aturan: 'Harap menjaga ketertiban bersama.',
    totalKamar: 4
  });

  // Modal State: Add Room
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [targetKosForRoom, setTargetKosForRoom] = useState(null);
  const [savingRoom, setSavingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({
    nomorKamar: '',
    harga: '',
    status: 'AVAILABLE'
  });

  // Modal State: Delete Kos Confirmation
  const [deleteKosModal, setDeleteKosModal] = useState(null);
  const [deletingKos, setDeletingKos] = useState(false);

  // Fetch Owner Data
  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const [dashRes, bookRes] = await Promise.all([
        api.get('/owner/dashboard'),
        api.get('/owner/bookings')
      ]);

      if (dashRes.data.success) {
        setStats(dashRes.data.data.stats || stats);
        setKosList(dashRes.data.data.kos || []);
        if (dashRes.data.data.kos?.length > 0 && !selectedKosForRooms) {
          setSelectedKosForRooms(dashRes.data.data.kos[0].id);
        }
      }
      if (bookRes.data.success) {
        setBookings(bookRes.data.data || []);
      }
    } catch (err) {
      console.error('Owner dashboard error:', err);
      triggerToast(err.response?.data?.message || 'Gagal memuat data pemilik kos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      navigate('/login?redirect=/owner/dashboard');
      return;
    }
    if (!isOwner && !isAdmin) {
      triggerToast('Akses khusus pemilik kos. Silakan login sebagai pemilik.', 'error');
      navigate('/tenant/dashboard');
      return;
    }
    fetchOwnerData();
    fetchOwnerReviews();
    fetchOwnerPayments();
    fetchFinancialSummary();
  }, [isAuthenticated, isOwner, isAdmin, authLoading]);

  // Handle Add/Edit Kos Submit
  const handleKosSubmit = async (e) => {
    e.preventDefault();
    try {
      setSavingKos(true);
      const payload = {
        ...kosForm,
        hargaBulanan: Number(kosForm.hargaBulanan),
        totalKamar: Number(kosForm.totalKamar),
        foto: kosForm.foto
      };

      if (editingKosId) {
        const res = await api.put(`/owner/kos/${editingKosId}`, payload);
        if (res.data.success) {
          triggerToast('Data properti kos berhasil diperbarui!', 'success');
        }
      } else {
        const res = await api.post('/owner/kos', payload);
        if (res.data.success) {
          triggerToast('Properti kos baru berhasil didaftarkan! 🎉', 'success');
        }
      }

      setKosModalOpen(false);
      setEditingKosId(null);
      await fetchOwnerData();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal menyimpan kos', 'error');
    } finally {
      setSavingKos(false);
    }
  };

  const openAddKosModal = () => {
    setEditingKosId(null);
    setPhotoUrlInput('');
    setKosForm({
      nama: '',
      deskripsi: '',
      alamat: '',
      kota: 'Purwokerto',
      hargaBulanan: '',
      type: 'CAMPUR',
      foto: [],
      fasilitas: ['WiFi', 'Kasur', 'Lemari', 'Kamar mandi dalam'],
      aturan: 'Harap menjaga ketertiban bersama di atas jam 22.00.',
      totalKamar: 4
    });
    setKosModalOpen(true);
  };

  const openEditKosModal = (k) => {
    setEditingKosId(k.id);
    setPhotoUrlInput('');
    setKosForm({
      nama: k.nama,
      deskripsi: k.deskripsi || '',
      alamat: k.alamat,
      kota: k.kota,
      hargaBulanan: k.hargaBulanan,
      type: k.type,
      foto: k.foto || [],
      fasilitas: k.fasilitas || [],
      aturan: k.aturan || '',
      totalKamar: k.totalKamar || (k.rooms?.length || 4)
    });
    setKosModalOpen(true);
  };

  // Handle Upload Foto Kos via multipart ke /api/uploads
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    if (kosForm.foto.length + files.length > 8) {
      triggerToast('Maksimal 8 foto per properti kos.', 'error');
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    try {
      setUploadingPhotos(true);
      const res = await api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        const urls = res.data.data?.urls || [];
        setKosForm((prev) => ({ ...prev, foto: [...prev.foto, ...urls] }));
        triggerToast(`${urls.length} foto berhasil diunggah.`, 'success');
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengunggah foto. Pastikan format JPG/PNG/WebP dan ukuran maksimal 2MB.', 'error');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleAddPhotoUrl = () => {
    const url = photoUrlInput.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) {
      triggerToast('URL foto harus diawali http:// atau https://', 'error');
      return;
    }
    if (kosForm.foto.includes(url)) {
      triggerToast('URL foto ini sudah ada di daftar.', 'error');
      return;
    }
    if (kosForm.foto.length >= 8) {
      triggerToast('Maksimal 8 foto per properti kos.', 'error');
      return;
    }
    setKosForm((prev) => ({ ...prev, foto: [...prev.foto, url] }));
    setPhotoUrlInput('');
  };

  const handleRemovePhoto = (url) => {
    setKosForm((prev) => ({ ...prev, foto: prev.foto.filter((f) => f !== url) }));
  };

  const handleMakePrimaryPhoto = (url) => {
    setKosForm((prev) => ({
      ...prev,
      foto: [url, ...prev.foto.filter((f) => f !== url)]
    }));
  };

  // Handle Delete Kos
  const handleConfirmDeleteKos = async () => {
    if (!deleteKosModal) return;
    try {
      setDeletingKos(true);
      await api.delete(`/owner/kos/${deleteKosModal.id}`);
      triggerToast(`Kos "${deleteKosModal.nama}" berhasil dihapus.`, 'success');
      setDeleteKosModal(null);
      await fetchOwnerData();
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal menghapus kos', 'error');
    } finally {
      setDeletingKos(false);
    }
  };

  // Handle Add Room Submit
  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (!targetKosForRoom) return;
    try {
      setSavingRoom(true);
      const res = await api.post(`/owner/kos/${targetKosForRoom.id}/rooms`, {
        ...roomForm,
        harga: roomForm.harga ? Number(roomForm.harga) : Number(targetKosForRoom.hargaBulanan)
      });
      if (res.data.success) {
        triggerToast('Kamar baru berhasil ditambahkan!', 'success');
        setRoomModalOpen(false);
        setRoomForm({ nomorKamar: '', harga: '', status: 'AVAILABLE' });
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal menambah kamar', 'error');
    } finally {
      setSavingRoom(false);
    }
  };

  // Handle Toggle Room Status directly
  const handleToggleRoomStatus = async (roomId, currentStatus) => {
    const nextStatus = currentStatus === 'AVAILABLE' ? 'OCCUPIED' : currentStatus === 'OCCUPIED' ? 'MAINTENANCE' : 'AVAILABLE';
    try {
      const res = await api.put(`/owner/rooms/${roomId}`, { status: nextStatus });
      if (res.data.success) {
        triggerToast(`Status kamar diubah menjadi ${nextStatus}`, 'success');
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast('Gagal mengubah status kamar', 'error');
    }
  };

  // Handle Delete Room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kamar ini?')) return;
    try {
      const res = await api.delete(`/owner/rooms/${roomId}`);
      if (res.data.success) {
        triggerToast('Kamar berhasil dihapus', 'success');
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast('Gagal menghapus kamar', 'error');
    }
  };

  // Handle Booking Status Update (Approve / Reject)
  const handleBookingStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await api.put(`/owner/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data.success) {
        const actionLabel = newStatus === 'APPROVED' ? 'Disetujui' : 'Ditolak';
        triggerToast(`Pengajuan sewa telah ${actionLabel}!`, 'success');
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal memperbarui status booking', 'error');
    }
  };

  // Handle Extension Approval/Rejection (Phase 14)
  const handleExtensionAction = async (bookingId, action) => {
    try {
      const res = await api.put(`/owner/bookings/${bookingId}/extend`, { action });
      if (res.data.success) {
        const label = action === 'APPROVE' ? 'disetujui ✅' : 'ditolak ❌';
        triggerToast(`Perpanjangan sewa berhasil ${label}`, 'success');
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal memproses perpanjangan sewa', 'error');
    }
  };

  // Fetch Reviews for Owner's properties
  const fetchOwnerReviews = async () => {
    try {
      setLoadingReviews(true);
      const res = await api.get('/reviews/owner');
      if (res.data.success) {
        setReviews(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch owner reviews error:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Open Reply Modal
  const openReplyModal = (rev) => {
    setSelectedReviewForReply(rev);
    setReplyText(rev.ownerReply || '');
    setReplyModalOpen(true);
  };

  // Submit Official Owner Reply
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedReviewForReply || !replyText.trim()) return;
    try {
      setSubmittingReply(true);
      const res = await api.post(`/reviews/${selectedReviewForReply.id}/reply`, {
        reply: replyText.trim()
      });
      if (res.data.success) {
        triggerToast('Tanggapan resmi Anda berhasil dipublikasikan! 💬', 'success');
        setReplyModalOpen(false);
        setSelectedReviewForReply(null);
        setReplyText('');
        await fetchOwnerReviews();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengirim balasan ulasan', 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  // Fetch Payments for Owner's properties (Phase 12)
  const fetchOwnerPayments = async () => {
    try {
      setLoadingPayments(true);
      const res = await api.get('/payments/owner');
      if (res.data.success) {
        setPayments(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch owner payments error:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  // Fetch Financial Summary (Phase 12)
  const fetchFinancialSummary = async () => {
    try {
      const res = await api.get('/payments/summary/owner');
      if (res.data.success) {
        setFinancialSummary(res.data.data);
      }
    } catch (err) {
      console.error('Fetch financial summary error:', err);
    }
  };

  // Handle Confirm Payment (Phase 12)
  const handleConfirmPayment = async (paymentId) => {
    try {
      setProcessingPaymentId(paymentId);
      const res = await api.patch(`/payments/${paymentId}/confirm`, {
        action: 'confirm'
      });
      if (res.data.success) {
        triggerToast('Pembayaran berhasil dikonfirmasi! Status sewa penyewa aktif. 💰', 'success');
        await fetchOwnerPayments();
        await fetchFinancialSummary();
        await fetchOwnerData();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal mengkonfirmasi pembayaran', 'error');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  // Handle Reject Payment (Phase 12)
  const handleRejectPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!rejectModalPayment) return;
    try {
      setProcessingPaymentId(rejectModalPayment.id);
      const res = await api.patch(`/payments/${rejectModalPayment.id}/confirm`, {
        action: 'reject',
        alasanPenolakan: rejectReason.trim()
      });
      if (res.data.success) {
        triggerToast('Pembayaran ditolak. Penyewa telah diberi notifikasi.', 'success');
        setRejectModalPayment(null);
        setRejectReason('');
        await fetchOwnerPayments();
        await fetchFinancialSummary();
      }
    } catch (err) {
      triggerToast(err.response?.data?.message || 'Gagal menolak pembayaran', 'error');
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (bookingFilter === 'ALL') return true;
    return b.status === bookingFilter;
  });

  const currentKosRooms = kosList.find(k => k.id === selectedKosForRooms)?.rooms || [];
  const occupancyRate = stats.totalRooms > 0 ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-20 right-4 z-50 animate-in fade-in slide-in-from-top-4">
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
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white mb-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-3 border border-emerald-500/30 backdrop-blur-sm">
              <Building className="w-3.5 h-3.5" />
              <span>Portal Pengelolaan Pemilik Kos</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-extrabold tracking-tight">
              Halo, {user?.name || 'Pemilik Kos'}! 🏢
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Kelola listing properti, kamar kos, konfirmasi booking penyewa, dan pantau performa okupansi bisnis Anda.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/chat"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 shadow-sm transition-all"
            >
              <MessageSquare className="w-4 h-4 text-emerald-300" />
              <span>Pesan & Chat</span>
            </Link>
            <button
              onClick={openAddKosModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kos Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Email Verification Banner (anti-troll gate) */}
      {isOwner && user && !user.emailVerified && (
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
            <MailWarning className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-800">Email Anda belum diverifikasi</h3>
            <p className="text-xs text-amber-700 mt-1">
              Demi keamanan platform, Anda belum bisa menambah atau mengubah data kos.
              Silakan cek email <span className="font-semibold">{user.email}</span> dan klik tautan verifikasi yang kami kirimkan.
            </p>
          </div>
          <button
            onClick={handleResendVerification}
            disabled={resendingVerification}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <MailWarning className="w-4 h-4" />}
            <span>{resendingVerification ? 'Mengirim...' : 'Kirim Ulang Email Verifikasi'}</span>
          </button>
        </div>
      )}

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div
          onClick={() => setActiveTab('kos')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-slate-900">{loading ? '...' : stats.totalProperties}</div>
          <p className="text-[11px] text-slate-400 mt-1">Unit properti aktif</p>
        </div>

        <div
          onClick={() => setActiveTab('kamar')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Kamar</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-slate-900">{loading ? '...' : stats.totalRooms}</div>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">{stats.availableRooms} kamar kosong</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Okupansi</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-indigo-600">{loading ? '...' : `${occupancyRate}%`}</div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-full rounded-full transition-all" style={{ width: `${occupancyRate}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-heading font-extrabold text-purple-700 truncate">
            {loading ? '...' : formatRupiah(stats.estimatedMonthlyRevenue)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Per bulan (kamar terisi)</p>
        </div>

        <div
          onClick={() => { setActiveTab('booking'); setBookingFilter('PENDING'); }}
          className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booking Baru</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-heading font-extrabold text-amber-600 flex items-center gap-2">
            <span>{loading ? '...' : stats.pendingBookings}</span>
            {stats.pendingBookings > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold uppercase">Perlu Respon</span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Menunggu persetujuan</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar gap-2">
        {[
          { key: 'ringkasan', label: 'Ringkasan' },
          { key: 'kos', label: `Daftar Kos (${kosList.length})` },
          { key: 'booking', label: `Permintaan Booking (${bookings.length})` },
          { key: 'kamar', label: `Kelola Kamar (${stats.totalRooms})` },
          { key: 'pembayaran', label: `Pembayaran & Keuangan ${payments.filter(p => p.status === 'PENDING').length > 0 ? `(${payments.filter(p => p.status === 'PENDING').length} Baru)` : `(${payments.length})`}` },
          { key: 'ulasan', label: `Ulasan & Rating (${reviews.length})` }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`py-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${
              activeTab === tab.key
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: RINGKASAN (OVERVIEW) */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-8">
          {/* Urgent Booking Alert */}
          {stats.pendingBookings > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-900">
                    Ada {stats.pendingBookings} Pengajuan Sewa Baru Menunggu Konfirmasi Anda!
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Penyewa sedang menunggu konfirmasi ketersediaan kamar. Respon cepat meningkatkan kepuasan calon penghuni kos.
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setActiveTab('booking'); setBookingFilter('PENDING'); }}
                className="whitespace-nowrap px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Tinjau Pengajuan Sekarang ➔
              </button>
            </div>
          )}

          {/* Quick List of Properties */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900">Properti Kos Yang Dikelola</h3>
              <button
                onClick={() => setActiveTab('kos')}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Lihat Semua ({kosList.length})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kosList.map((k) => (
                <div key={k.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="relative mb-3">
                      <img
                        src={k.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                        alt={k.nama}
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-900/70 text-white backdrop-blur-sm">
                        {k.type}
                      </span>
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-sm">
                        {k.kamarTersedia || 0} Kamar Kosong
                      </span>
                    </div>

                    <h4 className="font-heading font-bold text-sm text-slate-900 line-clamp-1">{k.nama}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{k.alamat}, {k.kota}</p>
                    <p className="text-sm font-extrabold text-emerald-700 mt-2">
                      {formatRupiah(k.hargaBulanan)} <span className="text-xs font-normal text-slate-400">/bln</span>
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                    <span className="text-slate-500 font-medium">{k.rooms?.length || k.totalKamar || 0} Total Kamar</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedKosForRooms(k.id);
                          setActiveTab('kamar');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                      >
                        Kamar
                      </button>
                      <button
                        onClick={() => openEditKosModal(k)}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <Link
                        to={`/kos/${k.id}`}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Halaman Publik"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DAFTAR KOS (PROPERTIES) */}
      {activeTab === 'kos' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">Listing Properti Kos Anda</h3>
              <p className="text-xs text-slate-500">Kelola informasi kos, foto, fasilitas, dan kamar dari masing-masing unit.</p>
            </div>
            <button
              onClick={openAddKosModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kos Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kosList.map((k) => (
              <div key={k.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="relative">
                    <img
                      src={k.foto?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'}
                      alt={k.nama}
                      className="w-full h-44 object-cover"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900/70 backdrop-blur-sm text-white">
                      {k.type}
                    </span>
                    <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-emerald-800 shadow-md">
                      {k.kamarTersedia || 0} / {k.rooms?.length || k.totalKamar || 0} Kamar Kosong
                    </span>
                  </div>

                  <div className="p-5">
                    <h4 className="font-heading font-bold text-base text-slate-900 mb-1">{k.nama}</h4>
                    <p className="text-xs text-slate-500 mb-3">{k.alamat}, {k.kota}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(k.fasilitas || []).slice(0, 3).map((f, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-medium">
                          {f}
                        </span>
                      ))}
                      {(k.fasilitas || []).length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-50 text-slate-400 rounded-md">
                          +{k.fasilitas.length - 3} lainnya
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-baseline pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-400">Harga Sewa</span>
                      <span className="text-base font-extrabold text-emerald-700">{formatRupiah(k.hargaBulanan)}/bln</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setSelectedKosForRooms(k.id);
                      setActiveTab('kamar');
                    }}
                    className="flex-1 py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors text-center"
                  >
                    Kelola Kamar ({k.rooms?.length || 0})
                  </button>
                  <button
                    onClick={() => openEditKosModal(k)}
                    className="p-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 rounded-xl transition-colors"
                    title="Edit Data Kos"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteKosModal(k)}
                    className="p-2 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 rounded-xl transition-colors"
                    title="Hapus Kos"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Link
                    to={`/kos/${k.id}`}
                    target="_blank"
                    className="p-2 bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-xl transition-colors"
                    title="Lihat Halaman Publik"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PERMINTAAN BOOKING (BOOKINGS) */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-heading font-bold text-lg text-slate-900">Permintaan Booking Masuk</h3>
              <p className="text-xs text-slate-500">Tinjau, setujui, atau tolak permohonan sewa dari calon penghuni kos Anda.</p>
            </div>

            {/* Filter Sub-Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              {[
                { key: 'ALL', label: 'Semua' },
                { key: 'PENDING', label: 'Menunggu' },
                { key: 'APPROVED', label: 'Disetujui' },
                { key: 'REJECTED', label: 'Ditolak' }
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setBookingFilter(f.key)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    bookingFilter === f.key
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length > 0 ? (
            <div className="space-y-4">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row gap-5 items-start"
                >
                  <div className="flex items-center gap-3 w-full md:w-56 flex-shrink-0">
                    <img
                      src={b.tenant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(b.tenant?.name || 'User')}`}
                      alt={b.tenant?.name}
                      className="w-12 h-12 rounded-full object-cover bg-slate-100 border border-slate-200"
                    />
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{b.tenant?.name || 'Calon Penyewa'}</h4>
                      <p className="text-xs text-slate-500">{b.tenant?.phone || 'No WhatsApp'}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">{b.tenant?.email}</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-xs w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{b.kos?.nama}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold">
                          {b.room?.nomorKamar || 'Kamar Standar'}
                        </span>
                      </div>

                      {b.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3.5 h-3.5" /> Disetujui
                        </span>
                      )}
                      {b.status === 'PENDING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan
                        </span>
                      )}
                      {b.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5" /> Ditolak
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 bg-slate-50 p-3 rounded-xl text-slate-700">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Mulai Sewa:</span>
                        <span className="font-semibold">
                          {new Date(b.tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Durasi Sewa:</span>
                        <span className="font-semibold">{b.durasiBulan} Bulan</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Pembayaran:</span>
                        <span className="font-bold text-emerald-700">{formatRupiah(b.totalHarga)}</span>
                      </div>
                    </div>

                    {b.catatan && (
                      <p className="text-slate-500 italic text-[11px] bg-slate-50/50 p-2 rounded">
                        "{b.catatan}"
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 flex-wrap">
                        {b.tenant?.phone && (
                          <a
                            href={`https://wa.me/${b.tenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${b.tenant.name}, saya pemilik ${b.kos?.nama} mengenai pengajuan sewa Anda.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold text-xs"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        )}

                        {b.status === 'APPROVED' && (
                          <>
                            <button
                              onClick={() => setSelectedAgreementBookingId(b.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1"
                            >
                              <FileText className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Kelola SPK</span>
                            </button>

                            <button
                              onClick={() => setSelectedInvoiceBookingId(b.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5 text-blue-700" />
                              <span>Invoice</span>
                            </button>
                          </>
                        )}
                      </div>

                      {b.status === 'PENDING' && (
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => handleBookingStatusChange(b.id, 'REJECTED')}
                            className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                          >
                            Tolak
                          </button>
                          <button
                            onClick={() => handleBookingStatusChange(b.id, 'APPROVED')}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors inline-flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Setujui Booking</span>
                          </button>
                        </div>
                      )}

                      {/* Extension Request Badge & Actions (Phase 14) */}
                      {b.extensionRequest?.status === 'PENDING' && (
                        <div className="w-full mt-2 p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span>Pengajuan Perpanjangan Sewa: +{b.extensionRequest.durasiBulan} Bulan</span>
                            <span className="font-semibold text-blue-600 ml-auto">{formatRupiah(b.extensionRequest.biayaPerpanjangan)}</span>
                          </div>
                          {b.extensionRequest.catatan && (
                            <p className="text-[11px] text-blue-700 italic">"{b.extensionRequest.catatan}"</p>
                          )}
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleExtensionAction(b.id, 'REJECT')}
                              className="px-3 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                            >
                              Tolak Perpanjangan
                            </button>
                            <button
                              onClick={() => handleExtensionAction(b.id, 'APPROVE')}
                              className="px-3 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>Setujui Perpanjangan</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-slate-800 text-sm mb-1">
                Tidak ada permintaan booking dengan status "{bookingFilter}"
              </h3>
              <p className="text-xs text-slate-500 mb-4">Pengajuan baru dari pencari kos akan muncul di sini secara real-time.</p>
              <button
                onClick={() => setBookingFilter('ALL')}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Tampilkan Semua
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: KELOLA KAMAR (ROOMS) */}
      {activeTab === 'kamar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Pilih Properti Kos:</label>
              <select
                value={selectedKosForRooms}
                onChange={(e) => setSelectedKosForRooms(e.target.value)}
                className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 font-semibold text-slate-800"
              >
                {kosList.map(k => (
                  <option key={k.id} value={k.id}>{k.nama} ({k.rooms?.length || 0} Kamar)</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                const target = kosList.find(k => k.id === selectedKosForRooms);
                setTargetKosForRoom(target);
                setRoomForm({
                  nomorKamar: `Kamar ${(target?.rooms?.length || 0) + 1}`,
                  harga: target?.hargaBulanan || '',
                  status: 'AVAILABLE'
                });
                setRoomModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kamar di Kos Ini</span>
            </button>
          </div>

          {currentKosRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {currentKosRooms.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-heading font-bold text-sm text-slate-900">{r.nomorKamar}</span>
                      <button
                        onClick={() => handleToggleRoomStatus(r.id, r.status)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase transition-transform hover:scale-105 ${
                          r.status === 'AVAILABLE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : r.status === 'OCCUPIED'
                            ? 'bg-slate-100 text-slate-700 border border-slate-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                        title="Klik untuk ubah status kamar"
                      >
                        {r.status === 'AVAILABLE' ? 'Kosong / Siap Sewa' : r.status === 'OCCUPIED' ? 'Terisi Penghuni' : 'Perbaikan'}
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mb-1">Tarif Sewa Kamar:</p>
                    <p className="text-sm font-extrabold text-emerald-700">{formatRupiah(r.harga)}/bln</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-3 text-xs">
                    <button
                      onClick={() => handleToggleRoomStatus(r.id, r.status)}
                      className="text-slate-600 hover:text-emerald-700 font-semibold text-[11px]"
                    >
                      Ubah Status ↺
                    </button>
                    <button
                      onClick={() => handleDeleteRoom(r.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                      title="Hapus Kamar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-slate-800 text-sm mb-1">Belum Ada Kamar Terdaftar</h3>
              <p className="text-xs text-slate-500 mb-4">Tambahkan kamar untuk kos ini agar calon penyewa bisa memilih kamar.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ULASAN & RATING */}
      {/* TAB: PEMBAYARAN & KEUANGAN (PHASE 12) */}
      {activeTab === 'pembayaran' && (
        <div className="space-y-6">
          {/* Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-heading font-extrabold text-emerald-700 truncate">
                {financialSummary ? formatRupiah(financialSummary.totalPendapatan) : formatRupiah(0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Dana sewa terkonfirmasi lunas</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Konfirmasi</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-heading font-extrabold text-amber-600 truncate">
                {financialSummary ? formatRupiah(financialSummary.menungguKonfirmasi) : formatRupiah(0)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Bukti transfer masuk baru</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaksi Sukses</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BadgeCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-heading font-extrabold text-slate-900">
                {financialSummary ? financialSummary.totalTransaksiKonfirmasi : 0}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total pembayaran disetujui</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tren Bulanan</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-sm font-bold text-purple-700">
                {financialSummary?.monthlyData?.length > 0
                  ? `${financialSummary.monthlyData[financialSummary.monthlyData.length - 1].bulan}: ${formatRupiah(financialSummary.monthlyData[financialSummary.monthlyData.length - 1].pendapatan)}`
                  : 'Aktif'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Rekap pendapatan terkini</p>
            </div>
          </div>

          {/* Monthly Trend Mini-Bar (if available) */}
          {financialSummary?.monthlyData && financialSummary.monthlyData.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-heading font-bold text-sm text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Grafik Estimasi Pendapatan Sewa (6 Bulan Terakhir)</span>
                </h4>
                <span className="text-[11px] text-slate-400">Diperbarui real-time</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {financialSummary.monthlyData.map((m, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center">
                    <p className="text-[11px] font-semibold text-slate-500">{m.bulan}</p>
                    <p className="text-xs font-bold text-emerald-700 mt-1">{formatRupiah(m.pendapatan)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{m.jumlahTransaksi} transaksi</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment List & Action Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-heading font-bold text-slate-900 text-base">Daftar Pembayaran Masuk</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verifikasi bukti transfer dari calon penyewa sebelum memberikan akses kamar.
                </p>
              </div>

              {/* Sub-Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  { key: 'ALL', label: 'Semua' },
                  { key: 'PENDING', label: 'Menunggu Konfirmasi' },
                  { key: 'CONFIRMED', label: 'Diterima' },
                  { key: 'REJECTED', label: 'Ditolak' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setPaymentFilter(f.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      paymentFilter === f.key
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {loadingPayments ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Memuat data pembayaran...</p>
              </div>
            ) : payments.filter(p => paymentFilter === 'ALL' || p.status === paymentFilter).length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-bold text-slate-800 text-sm mb-1">Tidak Ada Transaksi Pembayaran</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {paymentFilter === 'ALL'
                    ? 'Belum ada penyewa yang mengirimkan bukti transfer untuk kos Anda.'
                    : `Tidak ada transaksi dengan status "${paymentFilter}".`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {payments
                  .filter(p => paymentFilter === 'ALL' || p.status === paymentFilter)
                  .map(p => (
                    <div
                      key={p.id}
                      className="border border-slate-200 rounded-2xl p-4 sm:p-5 hover:border-slate-300 transition-all bg-white"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-heading font-bold text-slate-900 text-sm">{p.tenant?.name || 'Penyewa'}</span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                              {p.kos?.nama}
                            </span>
                            {p.status === 'CONFIRMED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Terverifikasi & Diterima
                              </span>
                            )}
                            {p.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Menunggu Verifikasi Anda
                              </span>
                            )}
                            {p.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                <CircleX className="w-3.5 h-3.5 text-rose-600" />
                                Ditolak
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 pt-1">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Metode:</span>
                              <span className="font-semibold">{p.metodePembayaran}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Rekening Pengirim:</span>
                              <span className="font-semibold">{p.namaRekening} ({p.nomorRekening || '-'})</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block text-[10px]">Waktu Kirim:</span>
                              <span>{new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          {p.catatan && (
                            <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-lg mt-1">
                              Catatan Penyewa: "{p.catatan}"
                            </p>
                          )}
                          {p.alasanPenolakan && (
                            <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-lg mt-1">
                              Alasan Penolakan: "{p.alasanPenolakan}"
                            </p>
                          )}
                        </div>

                        {/* Price & Action Section */}
                        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                          <div className="text-left lg:text-right">
                            <span className="text-slate-400 block text-[10px]">Nominal Transfer:</span>
                            <span className="text-base sm:text-lg font-extrabold text-emerald-700">{formatRupiah(p.jumlahTransfer)}</span>
                          </div>

                          {p.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleConfirmPayment(p.id)}
                                disabled={processingPaymentId === p.id}
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {processingPaymentId === p.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                <span>Konfirmasi Terima</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalPayment(p);
                                  setRejectReason('');
                                }}
                                disabled={processingPaymentId === p.id}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Tolak</span>
                              </button>
                            </div>
                          )}

                          {p.tenant?.phone && (
                            <a
                              href={`https://wa.me/${p.tenant.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo ${p.tenant.name}, mengenai pembayaran kos ${p.kos?.nama}...`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Hubungi WA ({p.tenant.phone})</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ULASAN & RATING */}
      {activeTab === 'ulasan' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">Ulasan & Reputasi Kos</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau feedback dari penghuni kos Anda dan berikan tanggapan resmi secara profesional.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Total Ulasan:</span>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                {reviews.length} Ulasan
              </span>
            </div>
          </div>

          {loadingReviews ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat ulasan properti Anda...</p>
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all space-y-4"
                >
                  {/* Review Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      {rev.tenant?.avatar ? (
                        <img
                          src={rev.tenant.avatar}
                          alt={rev.tenant.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center">
                          {rev.tenant?.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-sm text-slate-900">
                            {rev.tenant?.name || 'Penyewa'}
                          </span>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Penghuni Terverifikasi
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span>di <strong>{rev.kos?.nama || 'Kos'}</strong></span>
                          <span>•</span>
                          <span>{new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-start sm:self-auto">
                      <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                        <div className="flex text-amber-500">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-amber-900 ml-1">{rev.rating}.0</span>
                      </div>
                      <button
                        onClick={() => openReplyModal(rev)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          rev.ownerReply
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{rev.ownerReply ? 'Edit Balasan' : 'Balas Ulasan'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed pl-1">
                    "{rev.comment}"
                  </p>

                  {/* Official Owner Reply Card (if already answered) */}
                  {rev.ownerReply && (
                    <div className="ml-2 sm:ml-6 p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
                      <CornerDownRight className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-950">Respon Resmi Pemilik ({user?.name || 'Owner'})</span>
                          <span className="text-[10px] text-emerald-700">
                            {rev.replyAt ? new Date(rev.replyAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Baru saja'}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed">
                          {rev.ownerReply}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Star className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-heading font-bold text-slate-800 text-sm mb-1">Belum Ada Ulasan Masuk</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Ulasan dan rating dari penghuni kos Anda akan muncul di sini. Anda bisa memberikan respon resmi untuk membangun kepercayaan calon penyewa baru.
              </p>
            </div>
          )}
        </div>
      )}

      {/* MODAL: TAMBAH / EDIT KOS */}
      {kosModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h3 className="font-heading font-bold text-lg text-slate-900">
                {editingKosId ? 'Edit Data Properti Kos' : 'Daftarkan Properti Kos Baru'}
              </h3>
              <button onClick={() => setKosModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleKosSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kos *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kost Harmoni Asri Purwokerto"
                  value={kosForm.nama}
                  onChange={(e) => setKosForm({ ...kosForm, nama: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Purwokerto"
                    value={kosForm.kota}
                    onChange={(e) => setKosForm({ ...kosForm, kota: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Kos *</label>
                  <select
                    value={kosForm.type}
                    onChange={(e) => setKosForm({ ...kosForm, type: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 font-semibold"
                  >
                    <option value="CAMPUR">CAMPUR (Pria & Wanita)</option>
                    <option value="PUTRA">PUTRA (Khusus Pria)</option>
                    <option value="PUTRI">PUTRI (Khusus Wanita)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jl. Dr. Soeparno No. 45, Grendeng"
                  value={kosForm.alamat}
                  onChange={(e) => setKosForm({ ...kosForm, alamat: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Sewa Bulanan (Rp) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Contoh: 750000"
                    value={kosForm.hargaBulanan}
                    onChange={(e) => setKosForm({ ...kosForm, hargaBulanan: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jumlah Kamar Total *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={kosForm.totalKamar}
                    onChange={(e) => setKosForm({ ...kosForm, totalKamar: e.target.value })}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Foto Kos ({kosForm.foto.length}/8) — foto pertama menjadi foto utama
                </label>

                {/* Thumbnail Previews */}
                {kosForm.foto.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-3">
                    {kosForm.foto.map((url, idx) => (
                      <div key={url} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-[4/3] bg-slate-100">
                        <img src={url} alt={`Foto kos ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-600 text-white text-[9px] font-bold shadow-sm">
                            <Star className="w-2.5 h-2.5" /> UTAMA
                          </span>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleMakePrimaryPhoto(url)}
                              title="Jadikan foto utama"
                              className="p-1.5 rounded-lg bg-white/90 text-emerald-700 hover:bg-white"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(url)}
                            title="Hapus foto"
                            className="p-1.5 rounded-lg bg-white/90 text-red-600 hover:bg-white"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                <label
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors cursor-pointer ${
                    uploadingPhotos
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-500 cursor-wait'
                      : 'border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/40 text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  {uploadingPhotos ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Mengunggah foto...
                    </>
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      Unggah Foto dari Perangkat (JPG/PNG/WebP, maks 2MB)
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    multiple
                    disabled={uploadingPhotos}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>

                {/* Add by URL */}
                <div className="flex gap-2 mt-2.5">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Atau tempel URL foto (https://...)"
                      value={photoUrlInput}
                      onChange={(e) => setPhotoUrlInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPhotoUrl(); } }}
                      className="w-full text-xs pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPhotoUrl}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Tambah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Fasilitas Kos</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_FACILITIES.map(fac => (
                    <label key={fac} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={kosForm.fasilitas.includes(fac)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setKosForm({ ...kosForm, fasilitas: [...kosForm.fasilitas, fac] });
                          } else {
                            setKosForm({ ...kosForm, fasilitas: kosForm.fasilitas.filter(f => f !== fac) });
                          }
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{fac}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Kos</label>
                <textarea
                  rows="2"
                  placeholder="Jelaskan kenyamanan, akses jalan, dan keunggulan kos Anda..."
                  value={kosForm.deskripsi}
                  onChange={(e) => setKosForm({ ...kosForm, deskripsi: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setKosModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingKos}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingKos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{editingKosId ? 'Simpan Perubahan' : 'Daftarkan Kos'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH KAMAR */}
      {roomModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-heading font-bold text-base text-slate-900">
                Tambah Kamar Baru — {targetKosForRoom?.nama}
              </h3>
              <button onClick={() => setRoomModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRoomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor / Nama Kamar *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kamar 05 atau Kamar VIP A"
                  value={roomForm.nomorKamar}
                  onChange={(e) => setRoomForm({ ...roomForm, nomorKamar: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Bulanan Kamar Ini (Rp)</label>
                <input
                  type="number"
                  placeholder={targetKosForRoom?.hargaBulanan || '750000'}
                  value={roomForm.harga}
                  onChange={(e) => setRoomForm({ ...roomForm, harga: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[10px] text-slate-400">Kosongkan jika sama dengan harga umum kos.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Ketersediaan Kamar</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="AVAILABLE">Tersedia / Siap Sewa (AVAILABLE)</option>
                  <option value="OCCUPIED">Terisi Penghuni (OCCUPIED)</option>
                  <option value="MAINTENANCE">Sedang Renovasi (MAINTENANCE)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRoom}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {savingRoom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Simpan Kamar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: KONFIRMASI HAPUS KOS */}
      {deleteKosModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">
              Hapus Listing Properti Kos?
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Apakah Anda yakin ingin menghapus <strong>{deleteKosModal.nama}</strong>? Semua kamar dan riwayat di dalamnya akan dihapus dari platform.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteKosModal(null)}
                disabled={deletingKos}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDeleteKos}
                disabled={deletingKos}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {deletingKos ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Ya, Hapus Properti</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BALAS ULASAN */}
      {replyModalOpen && selectedReviewForReply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-emerald-700">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  {selectedReviewForReply.ownerReply ? 'Edit Balasan Ulasan' : 'Balas Ulasan Penghuni'}
                </h3>
              </div>
              <button
                onClick={() => setReplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Review summary */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs text-slate-800">
                  {selectedReviewForReply.tenant?.name || 'Penyewa'} • {selectedReviewForReply.kos?.nama || 'Kos'}
                </span>
                <div className="flex items-center text-amber-500 gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="text-xs font-bold text-slate-700">{selectedReviewForReply.rating}.0</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 italic">
                "{selectedReviewForReply.comment}"
              </p>
            </div>

            <form onSubmit={handleReplySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Respon / Tanggapan Anda Sebagai Pemilik Kos *
                </label>
                <textarea
                  rows="4"
                  required
                  placeholder="Terima kasih atas ulasannya! Kami selalu berusaha menjaga kebersihan dan kenyamanan..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-emerald-600 resize-none"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Balasan ini akan tampil secara publik di bawah ulasan penyewa pada halaman detail kos.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplyModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{selectedReviewForReply.ownerReply ? 'Simpan Balasan' : 'Kirim Balasan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TOLAK BUKTI PEMBAYARAN */}
      {rejectModalPayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <CircleX className="w-5 h-5" />
                <h3 className="font-heading font-bold text-base text-slate-900">
                  Tolak Bukti Pembayaran
                </h3>
              </div>
              <button
                onClick={() => setRejectModalPayment(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-xs text-rose-800 mb-4">
              <p>Penyewa: <strong>{rejectModalPayment.tenant?.name}</strong></p>
              <p>Nominal: <strong>{formatRupiah(rejectModalPayment.jumlahTransfer)}</strong> ({rejectModalPayment.metodePembayaran})</p>
            </div>

            <form onSubmit={handleRejectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alasan Penolakan (akan dikirimkan ke penyewa)
                </label>
                <textarea
                  rows="3"
                  placeholder="Misal: Nominal transfer tidak sesuai, bukti mutasi tidak terbaca, dll."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModalPayment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processingPaymentId === rejectModalPayment.id}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {processingPaymentId === rejectModalPayment.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleX className="w-3.5 h-3.5" />}
                  <span>Tolak Pembayaran</span>
                </button>
              </div>
            </form>
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
            fetchOwnerData();
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
