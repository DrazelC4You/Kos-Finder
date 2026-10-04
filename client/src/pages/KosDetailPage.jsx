import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatRupiah } from '../components/KosCard.jsx';
import KosMap from '../components/KosMap.jsx';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import {
  MapPin, Star, Heart, CheckCircle2, Bed, ArrowLeft, Shield,
  MessageSquare, Calendar, AlertCircle, Sparkles, Check, Info,
  Coffee, Flag
} from 'lucide-react';

export default function KosDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [kos, setKos] = useState(null);
  useDocumentTitle(kos ? `${kos.nama} — Kos di ${kos.kota}` : 'Detail Kos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    durasiBulan: 1,
    catatan: ''
  });

  // Reviews State
  const [reviewsData, setReviewsData] = useState({
    reviews: [],
    totalReviews: 0,
    averageRating: 0,
    breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [availabilityData, setAvailabilityData] = useState(null);
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);

  // Laporkan Kos (Report) State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchReviews = () => {
    api.get(`/reviews/kos/${id}`)
      .then(res => {
        if (res.data.success) {
          setReviewsData(res.data.data);
          // Check if current user already reviewed
          if (user) {
            const myRev = res.data.data.reviews.find(r => r.tenantId === user.id);
            if (myRev) {
              setRatingInput(myRev.rating);
              setCommentInput(myRev.comment);
            }
          }
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    setLoading(true);
    api.get(`/kos/${id}`)
      .then(res => {
        if (res.data.success) {
          setKos(res.data.data);
        }
      })
      .catch(err => {
        console.error('Error loading kos detail:', err);
        setError(err.response?.data?.message || 'Gagal memuat detail kos.');
      })
      .finally(() => setLoading(false));

    fetchReviews();

    // Fetch room availability timeline (Phase 14)
    api.get(`/kos/${id}/availability`)
      .then(res => {
        if (res.data.success) {
          setAvailabilityData(res.data.data);
        }
      })
      .catch(() => {});

    // Check if user has favorited this kos
    if (isAuthenticated) {
      api.get('/tenant/favorites')
        .then(res => {
          if (res.data.success) {
            const hasFav = res.data.data.some(f => f.kosId === id);
            setIsFavorited(hasFav);
          }
        })
        .catch(() => {});
    }
  }, [id, isAuthenticated, user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleOpenReport = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
      return;
    }
    setReportReason('');
    setReportModalOpen(true);
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      setSubmittingReport(true);
      const res = await api.post('/admin/reports', { kosId: id, reason: reportReason.trim() });
      if (res.data.success) {
        setReportModalOpen(false);
        setReportReason('');
        showToast('Laporan terkirim. Tim admin akan meninjau listing ini.');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await api.post(`/reviews/kos/${id}`, {
        rating: ratingInput,
        comment: commentInput
      });
      if (res.data.success) {
        showToast(res.data.message || 'Ulasan Anda berhasil dikirim! ⭐');
        setReviewFormOpen(false);
        fetchReviews();
        // Update kos rating locally
        api.get(`/kos/${id}`).then(r => { if (r.data.success) setKos(r.data.data); });
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengirim ulasan');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
      return;
    }

    try {
      if (isFavorited) {
        await api.delete(`/tenant/favorites/${id}`);
        setIsFavorited(false);
        showToast('Dihapus dari kos favorit');
      } else {
        await api.post(`/tenant/favorites/${id}`);
        setIsFavorited(true);
        showToast('Berhasil disimpan ke kos favorit ❤️');
      }
    } catch (err) {
      showToast('Gagal memperbarui status favorit');
    }
  };

  const handleOpenBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
      return;
    }
    setBookingModalOpen(true);
  };

  const handleSubmitBooking = async () => {
    try {
      setSubmittingBooking(true);
      const totalHarga = Number(kos.hargaBulanan) * Number(bookingForm.durasiBulan);
      const res = await api.post('/tenant/bookings', {
        kosId: kos.id,
        roomId: kos.rooms?.[0]?.id,
        durasiBulan: Number(bookingForm.durasiBulan),
        totalHarga,
        catatan: bookingForm.catatan
      });

      if (res.data.success) {
        setBookingModalOpen(false);
        showToast('Pengajuan sewa kos berhasil dikirim ke pemilik! 🎉');
        setTimeout(() => {
          navigate('/tenant/dashboard?tab=riwayat');
        }, 1200);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengirim pengajuan booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  const handleOpenChat = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
      return;
    }
    try {
      showToast('Membuka ruang obrolan langsung... 💬');
      const res = await api.post('/chat/conversations', {
        kosId: kos.id,
        ownerId: kos.ownerId
      });
      if (res.data.success) {
        navigate(`/chat?id=${res.data.data.id}`);
      } else {
        navigate('/chat');
      }
    } catch (err) {
      console.error('Open chat error:', err);
      navigate('/chat');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="w-24 h-4 bg-slate-200 rounded mb-6"></div>
        <div className="h-80 bg-slate-200 rounded-2xl mb-8"></div>
        <div className="w-2/3 h-8 bg-slate-200 rounded mb-4"></div>
        <div className="w-1/3 h-4 bg-slate-200 rounded mb-8"></div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-32 bg-slate-200 rounded-xl"></div>
            <div className="h-32 bg-slate-200 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !kos) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 font-heading mb-2">Kos Tidak Ditemukan</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'Data kos yang Anda cari mungkin telah dihapus atau tidak tersedia.'}</p>
        <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  const photos = kos.foto && kos.foto.length > 0
    ? kos.foto
    : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60'];

  const typeColorMap = {
    PUTRA: 'bg-blue-600 text-white',
    PUTRI: 'bg-pink-600 text-white',
    CAMPUR: 'bg-indigo-600 text-white'
  };

  const isAvail = (kos.kamarTersedia || 0) > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-sm font-medium animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700 bg-white hover:bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pencarian</span>
        </Link>
      </div>

      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${typeColorMap[kos.type] || 'bg-slate-700 text-white'}`}>
              {kos.type}
            </span>
            {kos.isVerified && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>✓ Terverifikasi</span>
              </span>
            )}
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 flex items-center gap-1 border border-amber-200">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{kos.rating ? Number(kos.rating).toFixed(1) : '4.8'}</span>
              <span className="text-slate-400 font-normal">({kos.jumlahReview || 0} review)</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            {kos.nama}
          </h1>
          <div className="flex items-center gap-1.5 text-slate-500 text-sm mt-1">
            <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{kos.alamat}, {kos.kota}</span>
          </div>
        </div>

        {/* Favorite Action Button */}
        <button
          onClick={handleToggleFavorite}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
            isFavorited
              ? 'bg-red-50 text-red-600 border-red-200 shadow-sm'
              : 'bg-white text-slate-700 hover:text-red-500 border-slate-200 hover:bg-slate-50 shadow-sm'
          }`}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
          <span>{isFavorited ? 'Tersimpan di Favorit' : 'Simpan Kos'}</span>
        </button>
      </div>

      {/* Gallery Photos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10 rounded-2xl overflow-hidden shadow-sm border border-slate-200 bg-slate-900">
        {/* Main Photo */}
        <div className="md:col-span-3 h-72 sm:h-96 w-full relative overflow-hidden bg-slate-800">
          <img
            src={photos[selectedPhotoIndex] || photos[0]}
            alt={kos.nama}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg text-xs text-white font-medium">
            Foto {selectedPhotoIndex + 1} dari {photos.length}
          </div>
        </div>

        {/* Side Thumbnails */}
        <div className="flex md:flex-col gap-2 p-2 bg-slate-950 overflow-x-auto md:overflow-y-auto max-h-96">
          {photos.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedPhotoIndex(idx)}
              className={`flex-shrink-0 md:flex-shrink w-24 md:w-full h-20 md:h-28 rounded-xl overflow-hidden border-2 transition-all ${
                selectedPhotoIndex === idx ? 'border-emerald-500 scale-[0.98]' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content & Sticky Booking Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Key Specs Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Tipe Kos</span>
              <span className="font-bold text-slate-800 text-sm">{kos.type}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Kamar</span>
              <span className="font-bold text-slate-800 text-sm">{kos.totalKamar || 0} Kamar</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider block mb-1">Ketersediaan</span>
              <span className="font-bold text-emerald-800 text-sm">{kos.kamarTersedia || 0} Kamar Kosong</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Rating</span>
              <span className="font-bold text-amber-600 text-sm">⭐ {kos.rating ? Number(kos.rating).toFixed(1) : '4.8'}</span>
            </div>
          </div>

          {/* Deskripsi */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-3">Deskripsi Kos</h3>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {kos.deskripsi || 'Kos nyaman dengan fasilitas pendukung lengkap di area strategis.'}
            </p>
          </div>

          {/* Fasilitas Terkategori (Phase 13) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Fasilitas Kos Lengkap</span>
            </h3>

            {/* Fasilitas Kamar */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-emerald-600" />
                <span>Fasilitas Kamar Pribadi</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(kos.fasilitas || []).filter(f => ['AC', 'Kamar mandi dalam', 'Kasur', 'Lemari', 'Meja & Kursi', 'WiFi', 'Listrik', 'Jendela', 'Water Heater'].some(x => f.toLowerCase().includes(x.toLowerCase()))).map((fac, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>{fac}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fasilitas Bersama & Parkir */}
            {(kos.fasilitas || []).some(f => ['Dapur', 'Kulkas', 'Ruang Tamu', 'Mesin Cuci', 'Parkir', 'Akses 24 Jam', 'CCTV'].some(x => f.toLowerCase().includes(x.toLowerCase()))) && (
              <div className="pt-3 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Coffee className="w-4 h-4 text-emerald-600" />
                  <span>Fasilitas Bersama & Keamanan</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(kos.fasilitas || []).filter(f => ['Dapur', 'Kulkas', 'Ruang Tamu', 'Mesin Cuci', 'Parkir', 'Akses 24 Jam', 'CCTV'].some(x => f.toLowerCase().includes(x.toLowerCase()))).map((fac, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Jadwal & Ketersediaan Kamar (Phase 14) */}
          {availabilityData && availabilityData.rooms && availabilityData.rooms.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 font-heading flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <span>Jadwal & Ketersediaan Kamar</span>
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {availabilityData.kamarTersedia} dari {availabilityData.totalKamar} Siap Huni
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availabilityData.rooms.map((room) => {
                  const isAvailable = room.status === 'AVAILABLE';
                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isAvailable
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">
                            Kamar {room.nomorKamar}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            {formatRupiah(room.harga || kos.hargaBulanan)}/bln
                          </span>
                        </div>
                        {isAvailable ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Kosong
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            Terisi
                          </span>
                        )}
                      </div>

                      {isAvailable ? (
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-500" /> Siap ditempati sekarang
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500">
                          {room.rentalEndDate ? (
                            <span>
                              Tersedia mulai:{' '}
                              <strong className="text-slate-700">
                                {new Date(room.rentalEndDate).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </strong>
                              {room.daysRemaining !== null && room.daysRemaining > 0 && (
                                <span className="text-amber-600 ml-1">
                                  ({room.daysRemaining} hari lagi)
                                </span>
                              )}
                            </span>
                          ) : (
                            'Sedang dalam masa sewa'
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Aturan Kos */}
          {kos.aturan && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 font-heading mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span>Aturan & Kebijakan Kos</span>
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {kos.aturan}
              </p>
            </div>
          )}

          {/* Lokasi pada Peta (Leaflet Map with Fallback as per Section 21) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">Lokasi Kos</h3>
            <p className="text-xs text-slate-500 mb-4">{kos.alamat}, {kos.kota}</p>

            <KosMap
              latitude={kos.latitude}
              longitude={kos.longitude}
              label={kos.nama}
            />

            <div className="flex justify-end mt-3">
              <button
                onClick={handleOpenReport}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-rose-600 transition-colors"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Laporkan Kos Ini</span>
              </button>
            </div>
          </div>

          {/* Review & Rating Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Ulasan & Rating Penghuni ({reviewsData.totalReviews})
                </h3>
                <p className="text-xs text-slate-500">Berdasarkan ulasan asli dari penyewa yang terverifikasi</p>
              </div>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    navigate('/login', { state: { from: { pathname: `/kos/${id}` } } });
                    return;
                  }
                  setReviewFormOpen(!reviewFormOpen);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 transition-all self-start sm:self-auto"
              >
                <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
                <span>{user && reviewsData.reviews.some(r => r.tenantId === user.id) ? 'Edit Ulasan Anda' : 'Tulis Ulasan'}</span>
              </button>
            </div>

            {/* Rating Summary & Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 items-center">
              <div className="text-center sm:border-r sm:border-slate-200 sm:pr-4">
                <div className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-heading">
                  {reviewsData.averageRating > 0 ? reviewsData.averageRating.toFixed(1) : (kos.rating ? Number(kos.rating).toFixed(1) : '5.0')}
                </div>
                <div className="flex justify-center text-amber-400 my-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(reviewsData.averageRating || kos.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-slate-500">{reviewsData.totalReviews} ulasan terverifikasi</p>
              </div>

              <div className="sm:col-span-2 space-y-1.5 text-xs text-slate-600">
                {[5, 4, 3, 2, 1].map(stars => {
                  const count = reviewsData.breakdown[stars] || 0;
                  const pct = reviewsData.totalReviews > 0 ? Math.round((count / reviewsData.totalReviews) * 100) : 0;
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="w-12 text-[11px] font-semibold flex items-center gap-1">
                        {stars} <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                      </span>
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="w-8 text-[11px] text-slate-400 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Review Form */}
            {reviewFormOpen && (
              <form onSubmit={handleReviewSubmit} className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-900">
                    {user && reviewsData.reviews.some(r => r.tenantId === user.id) ? 'Perbarui Ulasan Anda' : 'Beri Nilai & Ulasan untuk Kos Ini'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setReviewFormOpen(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Batal
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rating Bintang:</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        className="p-1 text-2xl transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star className={`w-6 h-6 ${star <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-slate-700 ml-2">
                      {ratingInput === 5 ? '⭐⭐⭐⭐⭐ Luar Biasa!' :
                       ratingInput === 4 ? '⭐⭐⭐⭐ Bagus & Nyaman' :
                       ratingInput === 3 ? '⭐⭐⭐ Cukup Baik' :
                       ratingInput === 2 ? '⭐⭐ Kurang Memuaskan' : '⭐ Buruk'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pengalaman Anda Sewa di Sini:</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Ceritakan tentang kebersihan kamar, keramahan pemilik, kecepatan WiFi, kenyamanan lingkungan..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {submittingReview ? 'Mengirim...' : 'Kirim Ulasan Sekarang'}
                  </button>
                </div>
              </form>
            )}

            {/* Review List */}
            {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
              <div className="space-y-4 pt-2">
                {reviewsData.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={rev.tenant?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(rev.tenant?.name || rev.id)}`}
                          alt={rev.tenant?.name || 'Penyewa'}
                          className="w-8 h-8 rounded-full bg-slate-200 object-cover border border-slate-200"
                        />
                        <div>
                          <h5 className="font-bold text-xs text-slate-800">{rev.tenant?.name || 'Penyewa Terverifikasi'}</h5>
                          <span className="text-[10px] text-slate-400">
                            {new Date(rev.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex text-amber-400 text-xs">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-10">"{rev.comment}"</p>

                    {/* Owner Official Reply Box */}
                    {rev.ownerReply && (
                      <div className="ml-10 p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-[11px]">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-extrabold uppercase tracking-wide">
                            Respon Pemilik Kos
                          </span>
                          <span>{kos.owner?.name || 'Pemilik Kos'}</span>
                          {rev.replyAt && (
                            <span className="text-slate-400 text-[10px] font-normal">
                              • {new Date(rev.replyAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 italic pl-1">"{rev.ownerReply}"</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-xs text-slate-500 italic mb-2">Belum ada ulasan untuk kos ini.</p>
                <p className="text-xs text-slate-400">Jadilah penyewa pertama yang memberikan ulasan dan rating!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sticky Pricing & Action Card */}
        <div className="lg:col-span-1 sticky top-20">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg space-y-6">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Harga Sewa</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-heading">
                  {formatRupiah(kos.hargaBulanan)}
                </span>
                <span className="text-xs text-slate-500 font-medium">/ bulan</span>
              </div>
            </div>

            {/* Room Availability Pill */}
            <div className={`p-3 rounded-xl flex items-center gap-2 text-xs font-semibold ${
              isAvail ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <Bed className="w-4 h-4 flex-shrink-0" />
              <span>{isAvail ? `Tersedia ${kos.kamarTersedia} kamar kosong siap huni` : 'Semua kamar saat ini sedang terisi'}</span>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleOpenBooking}
                disabled={!isAvail}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                <span>{isAvail ? 'Booking Kamar Sekarang' : 'Kamar Penuh'}</span>
              </button>

              <button
                onClick={handleOpenChat}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Hubungi / Chat Pemilik</span>
              </button>
            </div>

            {/* Owner Info Profile */}
            <div className="pt-5 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                Dikelola Oleh
              </span>
              <div className="flex items-center gap-3">
                <img
                  src={kos.owner?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${kos.ownerId}`}
                  alt={kos.owner?.name || 'Pemilik'}
                  className="w-11 h-11 rounded-full bg-slate-200 object-cover border border-slate-200"
                />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{kos.owner?.name || 'Pemilik Kos'}</h4>
                  <p className="text-xs text-slate-500">{kos.owner?.phone || '0812-3456-7890'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="font-heading font-bold text-lg text-slate-900 mb-1">Konfirmasi Pengajuan Booking</h3>
            <p className="text-xs text-slate-500 mb-4">Pengajuan sewa untuk <strong>{kos.nama}</strong></p>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Durasi Sewa</label>
                <select
                  value={bookingForm.durasiBulan}
                  onChange={(e) => setBookingForm({ ...bookingForm, durasiBulan: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600 font-medium"
                >
                  <option value={1}>1 Bulan</option>
                  <option value={3}>3 Bulan</option>
                  <option value={6}>6 Bulan</option>
                  <option value={12}>12 Bulan (1 Tahun)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan (Opsional)</label>
                <textarea
                  rows="2"
                  placeholder="Contoh: Rencana masuk tanggal 1, butuh tempat parkir motor."
                  value={bookingForm.catatan}
                  onChange={(e) => setBookingForm({ ...bookingForm, catatan: e.target.value })}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-2 text-slate-700 border border-slate-100">
                <div className="flex justify-between">
                  <span>Harga Sewa Per Bulan:</span>
                  <span className="font-medium">{formatRupiah(kos.hargaBulanan)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Durasi:</span>
                  <span className="font-medium">{bookingForm.durasiBulan} Bulan</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900">
                  <span>Total Biaya Sewa:</span>
                  <span className="text-emerald-700">{formatRupiah(Number(kos.hargaBulanan) * Number(bookingForm.durasiBulan))}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingModalOpen(false)}
                disabled={submittingBooking}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitBooking}
                disabled={submittingBooking}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {submittingBooking ? 'Mengirim...' : 'Kirim Pengajuan Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Laporkan Kos Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-4 h-4 text-rose-600" />
              <h3 className="font-heading font-bold text-lg text-slate-900">Laporkan Kos Ini</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Laporkan <strong>{kos.nama}</strong> jika ada indikasi penipuan, data tidak sesuai, atau pelanggaran. Tim admin akan meninjau laporan Anda.
            </p>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Laporan</label>
                <textarea
                  rows="4"
                  required
                  placeholder="Jelaskan secara singkat masalah pada listing ini..."
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  disabled={submittingReport}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportReason.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
