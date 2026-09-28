import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import KosCard from '../components/KosCard.jsx';
import KosCardSkeleton from '../components/KosCardSkeleton.jsx';
import {
  Search, MapPin, DollarSign, Home, CheckCircle2, Shield,
  ArrowRight, Users, Sparkles, ChevronDown, ChevronUp,
  GraduationCap
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  // Search filter states in Hero
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Data states
  const [popularKos, setPopularKos] = useState([]);
  const [latestKos, setLatestKos] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);

  // FAQ toggle state
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    // Fetch Kos Populer
    api.get('/kos?sort=popular&limit=3')
      .then(res => {
        if (res.data.success) {
          setPopularKos(res.data.data);
        }
      })
      .catch(err => console.error('Error loading popular kos:', err))
      .finally(() => setLoadingPopular(false));

    // Fetch Kos Terbaru
    api.get('/kos?sort=newest&limit=3')
      .then(res => {
        if (res.data.success) {
          setLatestKos(res.data.data);
        }
      })
      .catch(err => console.error('Error loading latest kos:', err))
      .finally(() => setLoadingLatest(false));
  }, []);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (selectedType) params.append('type', selectedType);

    navigate(`/cari?${params.toString()}`);
  };

  const faqs = [
    {
      q: 'Apakah mencari kos di KosFinder dipungut biaya?',
      a: 'Tidak sama sekali! KosFinder 100% gratis untuk pencari kos. Anda dapat mencari, melihat detail, dan menghubungi pemilik tanpa biaya perantara.'
    },
    {
      q: 'Bagaimana cara menghubungi pemilik kos?',
      a: 'Pada halaman detail kos, klik tombol "Hubungi / Chat Pemilik" untuk langsung membuka template chat atau kontak pemilik kos terkait.'
    },
    {
      q: 'Bagaimana cara mendaftarkan kos saya sebagai pemilik?',
      a: 'Daftar akun baru dengan memilih peran "Pemilik Kos (Owner)". Setelah masuk, Anda dapat langsung mendaftarkan properti dan mengelola ketersediaan kamar.'
    },
    {
      q: 'Apakah ketersediaan kamar di KosFinder selalu terbarui?',
      a: 'Ya, pemilik kos memperbarui status kamar secara berkala dan sistem secara otomatis menghitung jumlah kamar yang siap huni.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-50 pt-12 pb-16 border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 mb-5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Platform Cari & Kelola Kos No. 1
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight">
            Temukan Tempat Tinggal <br />
            <span className="text-emerald-600">yang Tepat untukmu.</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Cari kos berdasarkan lokasi, harga, fasilitas, dan kebutuhanmu dengan transparan dan terstruktur.
          </p>

          {/* Large Hero Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="mt-8 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-full shadow-xl border border-slate-200/80 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-left"
          >
            {/* Input Lokasi */}
            <div className="px-4 py-2 sm:border-r border-slate-200">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Lokasi / Kota
              </label>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Purwokerto, Kembaran..."
                  className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Input Harga Maksimal */}
            <div className="px-4 py-2 sm:border-r border-slate-200">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Harga Maksimal
              </label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-sm font-medium text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="">Semua Harga</option>
                  <option value="600000">Hingga Rp 600rb</option>
                  <option value="800000">Hingga Rp 800rb</option>
                  <option value="1000000">Hingga Rp 1 Juta</option>
                  <option value="1500000">Hingga Rp 1.5 Juta</option>
                </select>
              </div>
            </div>

            {/* Input Tipe Kos */}
            <div className="px-4 py-2 sm:border-r border-slate-200">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                Tipe Kos
              </label>
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full text-sm font-medium text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                >
                  <option value="">Semua Tipe</option>
                  <option value="CAMPUR">Campur</option>
                  <option value="PUTRA">Khusus Putra</option>
                  <option value="PUTRI">Khusus Putri</option>
                </select>
              </div>
            </div>

            {/* Tombol Submit */}
            <div className="p-1">
              <button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl sm:rounded-full transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Cari Kos</span>
              </button>
            </div>
          </form>

          {/* Quick Tags */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
            <span>Kota Populer:</span>
            {['Yogyakarta', 'Bandung', 'Jakarta', 'Malang', 'Surabaya', 'Semarang', 'Purwokerto', 'Bali'].map((tag, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  navigate(`/cari?kota=${encodeURIComponent(tag === 'Bali' ? 'Denpasar' : tag === 'Jakarta' ? 'Jakarta Selatan' : tag)}`);
                }}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 transition-all shadow-xs font-medium"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 1.5 POPULAR CITIES IN INDONESIA SHOWCASE */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">
              Destinasi Pilihan di Seluruh Nusantara 🇮🇩
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
              Cari Kos di Kota Favoritmu
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Temukan hunian sewa terbaik di berbagai kota pendidikan dan bisnis di Indonesia
            </p>
          </div>
          <Link
            to="/cari"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>Semua Kota</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
          {[
            {
              nama: 'Yogyakarta',
              query: 'Yogyakarta',
              tagline: 'Kota Pelajar • UGM, UNY',
              img: 'https://images.unsplash.com/photo-1596402184320-417e7178b2cd?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Bandung',
              query: 'Bandung',
              tagline: 'Kota Kembang • ITB, UNPAD',
              img: 'https://images.unsplash.com/photo-1584810359583-96fc3448beaa?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Jakarta Selatan',
              query: 'Jakarta Selatan',
              tagline: 'Pusat Bisnis • Tebet, Kuningan',
              img: 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Malang',
              query: 'Malang',
              tagline: 'Kota Sejuk • UB, UM, Polinema',
              img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Surabaya',
              query: 'Surabaya',
              tagline: 'Kota Pahlawan • UNAIR, ITS',
              img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Semarang',
              query: 'Semarang',
              tagline: 'Kota Atlas • UNDIP, UNNES',
              img: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Bali (Denpasar)',
              query: 'Denpasar',
              tagline: 'Pulau Dewata • Udayana, Renon',
              img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&auto=format&fit=crop&q=80'
            },
            {
              nama: 'Purwokerto',
              query: 'Purwokerto',
              tagline: 'Kota Satria • UNSOED, UMP',
              img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&auto=format&fit=crop&q=80'
            }
          ].map((item, idx) => (
            <Link
              key={idx}
              to={`/cari?kota=${encodeURIComponent(item.query)}`}
              className="relative group rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-slate-200 transition-all duration-300 block aspect-[4/3]"
            >
              <img
                src={item.img}
                alt={item.nama}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.75]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent p-4 flex flex-col justify-end text-white">
                <span className="font-heading font-extrabold text-sm sm:text-base text-white group-hover:text-emerald-300 transition-colors">
                  {item.nama}
                </span>
                <p className="text-[10px] sm:text-[11px] text-slate-300 truncate mt-0.5">
                  {item.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. KOS POPULER SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Rekomendasi Pilihan</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Kos Populer</h2>
            <p className="text-sm text-slate-500 mt-1">Kos dengan ulasan dan rating tertinggi dari pencari kos</p>
          </div>
          <Link
            to="/cari?sort=popular"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingPopular ? (
            <>
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
            </>
          ) : popularKos.length > 0 ? (
            popularKos.map((kos) => <KosCard key={kos.id} kos={kos} />)
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm">
              Belum ada kos terdaftar.
            </div>
          )}
        </div>
      </section>

      {/* 2.5 CAMPUS & LANDMARKS SHOWCASE (PHASE 13) */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-12 text-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Lokasi Favorit Mahasiswa
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-heading">
                Cari Kos Dekat Kampusmu 🎓
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Akses cepat ke kos-kosan strategis di sekitar universitas terkemuka di Purwokerto
              </p>
            </div>
            <Link
              to="/cari"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline"
            >
              <span>Jelajahi Semua Area</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                id: 'unsoed',
                name: 'UNSOED Purwokerto',
                full: 'Universitas Jenderal Soedirman',
                area: 'Grendeng & Karangwangkal',
                bg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/30 hover:border-emerald-400'
              },
              {
                id: 'ump',
                name: 'UMP Purwokerto',
                full: 'Univ. Muhammadiyah Purwokerto',
                area: 'Dukuhwaluh & Kembaran',
                bg: 'from-blue-900/60 to-blue-950/90 border-blue-500/30 hover:border-blue-400'
              },
              {
                id: 'telkom',
                name: 'Telkom University',
                full: 'Telkom University Purwokerto',
                area: 'Jl. D.I. Panjaitan',
                bg: 'from-rose-900/60 to-rose-950/90 border-rose-500/30 hover:border-rose-400'
              },
              {
                id: 'uinsaizu',
                name: 'UIN Saizu Purwokerto',
                full: 'UIN Prof. K.H. Saifuddin Zuhri',
                area: 'Karangkobar, Purwokerto Barat',
                bg: 'from-teal-900/60 to-teal-950/90 border-teal-500/30 hover:border-teal-400'
              }
            ].map((c) => (
              <Link
                key={c.id}
                to={`/cari?campus=${c.id}`}
                className={`p-5 rounded-2xl bg-gradient-to-br ${c.bg} border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group block`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center mb-3 backdrop-blur-sm group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-emerald-300" />
                </div>
                <h3 className="font-heading font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                  {c.name}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">{c.full}</p>
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300 font-semibold">
                  <span className="text-slate-400 font-normal text-[11px]">{c.area}</span>
                  <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    <span>Lihat Kos</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. KOS TERBARU SECTION */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Hunian Siap Huni</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Kos Terbaru</h2>
            <p className="text-sm text-slate-500 mt-1">Daftar kos paling baru yang ditambahkan pemilik kos</p>
          </div>
          <Link
            to="/cari?sort=newest"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingLatest ? (
            <>
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
            </>
          ) : latestKos.length > 0 ? (
            latestKos.map((kos) => <KosCard key={kos.id} kos={kos} />)
          ) : (
            <div className="col-span-full py-8 text-center text-slate-400 text-sm">
              Belum ada kos terdaftar.
            </div>
          )}
        </div>
      </section>

      {/* 4. KENAPA KOSFINDER? */}
      <section className="bg-white py-14 border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Kenapa Memilih KosFinder?</h2>
            <p className="text-sm text-slate-500 mt-2">Solusi pencarian hunian kos yang terpercaya, aman, dan tanpa biaya perantara.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base mb-2">100% Bebas Calo</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Langsung terhubung dengan pemilik kos. Tidak ada biaya komisi atau perantara tambahan.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base mb-2">Data Terverifikasi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Informasi kamar, foto asli, fasilitas, dan harga diperbarui langsung oleh pemilik kos.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base mb-2">Ulasan Jujur Penghuni</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Lihat rating dan review nyata dari mahasiswa serta pekerja yang pernah menyewa sebelumnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CARA KERJA KOSFINDER */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Panduan Praktis</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Cara Kerja KosFinder</h2>
          <p className="text-sm text-slate-500 mt-2">Dapatkan kamar kos impian Anda hanya dalam 4 langkah sederhana</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: '1', title: 'Cari & Filter', desc: 'Tentukan lokasi, batas harga, tipe kos, dan fasilitas yang diinginkan.' },
            { step: '2', title: 'Cek Ketersediaan', desc: 'Periksa foto, jumlah kamar kosong, fasilitas, dan aturan kos.' },
            { step: '3', title: 'Hubungi Pemilik', desc: 'Kontak pemilik kos via chat untuk menanyakan detail atau jadwalkan survei.' },
            { step: '4', title: 'Booking & Huni', desc: 'Lakukan pengajuan booking kamar dan kos siap dihuni dengan nyaman.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative text-center">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-heading font-bold text-sm flex items-center justify-center mx-auto mb-4 shadow-md shadow-emerald-600/30">
                {item.step}
              </div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. UNTUK PEMILIK KOS (OWNER CTA BANNER) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-600 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-3">
              Area Pemilik Kos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-heading mb-3">
              Punya Kos? Kelola Kamar dan Temukan Penyewa dengan Mudah.
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed mb-6">
              Pasang listing kos Anda secara gratis di KosFinder. Pantau keterisian kamar, kelola data penyewa, dan terima booking langsung dari genggaman Anda.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-emerald-800 font-bold text-sm rounded-xl shadow-lg hover:bg-emerald-50 transition-all"
              >
                Daftarkan Kos Sekarang
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 bg-emerald-900/40 hover:bg-emerald-900/60 text-white font-semibold text-sm rounded-xl border border-emerald-400/30 transition-all"
              >
                Masuk Dashboard Pemilik
              </Link>
            </div>
          </div>
          <div className="text-8xl select-none opacity-80">
            🏠
          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <section className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Pusat Informasi</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">Pertanyaan Umum (FAQ)</h2>
          <p className="text-sm text-slate-500 mt-1">Jawaban atas pertanyaan yang sering diajukan</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between text-left text-sm font-bold text-slate-800 hover:text-emerald-600 transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
