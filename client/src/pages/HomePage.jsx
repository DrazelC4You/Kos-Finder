import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import KosCard from '../components/KosCard.jsx';
import KosCardSkeleton from '../components/KosCardSkeleton.jsx';
import SearchDropdown from '../components/SearchDropdown.jsx';
import {
  Search, MapPin, Banknote, Home, CheckCircle2, Shield,
  ArrowRight, Users, Sparkles, ChevronDown, ChevronUp,
  GraduationCap, Building2, KeyRound, CalendarCheck, UserCheck
} from 'lucide-react';

const headlines = [
  {
    ariaLabel: 'Temukan Tempat Tinggal yang Tepat untukmu.',
    node: (
      <>
        Temukan Tempat Tinggal <br />
        <span className="text-emerald-600">yang Tepat untukmu.</span>
      </>
    ),
  },
  {
    ariaLabel: 'Punya Kos? Kelola Kamar dan Temukan Penyewa dengan Mudah.',
    node: (
      <>
        Punya Kos? <br />
        <span className="text-emerald-600">Kelola Kamar dan Temukan Penyewa dengan Mudah.</span>
      </>
    ),
  },
];

const RotatingHeroHeadline = React.memo(function RotatingHeroHeadline() {
  const [activeIndex, setActiveIndex]   = useState(0);
  const [isInitial, setIsInitial]       = useState(true);
  const [direction, setDirection]       = useState('next'); // 'next' | 'prev'
  const intervalRef                     = React.useRef(null);

  const startInterval = React.useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setIsInitial(false);
      setDirection('next');
      setActiveIndex((prev) => (prev + 1) % headlines.length);
    }, 4800);
  }, []);

  useEffect(() => {
    startInterval();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      } else {
        startInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [startInterval]);

  const goNext = () => {
    setIsInitial(false);
    setDirection('next');
    setActiveIndex((prev) => (prev + 1) % headlines.length);
    startInterval();
  };

  const goPrev = () => {
    setIsInitial(false);
    setDirection('prev');
    setActiveIndex((prev) => (prev - 1 + headlines.length) % headlines.length);
    startInterval();
  };

  // Pick CSS classes based on direction
  const inClass  = direction === 'next' ? 'animate-headline-in-right'  : 'animate-headline-in-left';
  const outClass = direction === 'next' ? 'animate-headline-out-left'   : 'animate-headline-out-right';

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto gap-4">
      {/* Headline row: prev button + sliding text + next button */}
      <div className="relative flex items-center justify-center w-full">
        {/* Prev button — hidden on mobile, visible sm+ */}
        <button
          onClick={goPrev}
          aria-label="Headline sebelumnya"
          className="hidden sm:flex absolute -left-8 lg:-left-14 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Headline */}
        <div className="[overflow-x:clip] w-full">
          <h1
            className="grid grid-cols-1 grid-rows-1 items-center justify-items-center text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight font-heading leading-tight"
            aria-label={headlines[activeIndex].ariaLabel}
          >
            {headlines.map((h, i) => (
              <span
                key={i}
                aria-hidden={activeIndex !== i}
                className={`col-start-1 row-start-1 w-full ${
                  isInitial
                    ? i === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    : activeIndex === i
                    ? inClass
                    : `${outClass} pointer-events-none`
                }`}
              >
                {h.node}
              </span>
            ))}
          </h1>
        </div>

        {/* Next button — hidden on mobile, visible sm+ */}
        <button
          onClick={goNext}
          aria-label="Headline berikutnya"
          className="hidden sm:flex absolute -right-8 lg:-right-14 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Dot indicators + mobile nav buttons — always in-flow, never overlap */}
      <div className="flex items-center justify-center gap-3">
        {/* Prev — mobile only */}
        <button
          onClick={goPrev}
          aria-label="Headline sebelumnya"
          className="sm:hidden flex items-center justify-center w-7 h-7 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {headlines.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                if (i === activeIndex) return;
                setIsInitial(false);
                setDirection(i > activeIndex ? 'next' : 'prev');
                setActiveIndex(i);
                startInterval();
              }}
              aria-label={`Headline ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                activeIndex === i
                  ? 'w-6 h-1.5 bg-emerald-600'
                  : 'w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
            />
          ))}
        </div>

        {/* Next — mobile only */}
        <button
          onClick={goNext}
          aria-label="Headline berikutnya"
          className="sm:hidden flex items-center justify-center w-7 h-7 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
});


const PRICE_OPTIONS = [
  { value: '', label: 'Semua Harga' },
  { value: '600000', label: 'Hingga Rp 600rb' },
  { value: '800000', label: 'Hingga Rp 800rb' },
  { value: '1000000', label: 'Hingga Rp 1 Juta' },
  { value: '1500000', label: 'Hingga Rp 1.5 Juta' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Semua Tipe' },
  { value: 'CAMPUR', label: 'Campur' },
  { value: 'PUTRA', label: 'Khusus Putra' },
  { value: 'PUTRI', label: 'Khusus Putri' },
];

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
          <RotatingHeroHeadline />
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
            <SearchDropdown
              id="hero-price"
              label="Harga Maksimal"
              icon={Banknote}
              value={maxPrice}
              onChange={setMaxPrice}
              options={PRICE_OPTIONS}
              placeholder="Semua Harga"
              menuWidth="w-full sm:w-[220px]"
            />

            {/* Input Tipe Kos */}
            <SearchDropdown
              id="hero-type"
              label="Tipe Kos"
              icon={Home}
              value={selectedType}
              onChange={setSelectedType}
              options={TYPE_OPTIONS}
              placeholder="Semua Tipe"
              menuWidth="w-full sm:w-[200px]"
            />

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
              img: '/cities/yogyakarta.png'
            },
            {
              nama: 'Bandung',
              query: 'Bandung',
              tagline: 'Kota Kembang • ITB, UNPAD',
              img: '/cities/bandung.png'
            },
            {
              nama: 'Jakarta Selatan',
              query: 'Jakarta Selatan',
              tagline: 'Pusat Bisnis • Tebet, Kuningan',
              img: '/cities/jakarta.png'
            },
            {
              nama: 'Malang',
              query: 'Malang',
              tagline: 'Kota Sejuk • UB, UM, Polinema',
              img: '/cities/malang.png'
            },
            {
              nama: 'Surabaya',
              query: 'Surabaya',
              tagline: 'Kota Pahlawan • UNAIR, ITS',
              img: '/cities/surabaya.png'
            },
            {
              nama: 'Semarang',
              query: 'Semarang',
              tagline: 'Kota Atlas • UNDIP, UNNES',
              img: '/cities/semarang.png'
            },
            {
              nama: 'Bali (Denpasar)',
              query: 'Denpasar',
              tagline: 'Pulau Dewata • Udayana, Renon',
              img: '/cities/bali.png'
            },
            {
              nama: 'Purwokerto',
              query: 'Purwokerto',
              tagline: 'Kota Satria • UNSOED, UMP',
              img: '/cities/purwokerto.png'
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

      {/* 6. UNTUK PEMILIK KOS (OWNER PRODUCT CTA) */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 rounded-3xl overflow-hidden shadow-xl">
          {/* Subtle decorative rings */}
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full border border-white/[0.07] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-emerald-900/20 -translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-center gap-8 px-8 py-10 sm:px-12 sm:py-12">

            {/* LEFT: Copy & CTAs */}
            <div className="flex-1 min-w-0 text-center md:text-left">

              {/* 1. Badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-semibold text-emerald-100 mb-4">
                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                Untuk Pemilik Kos
              </span>

              {/* 2. Headline */}
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white leading-tight mb-3">
                Punya Kos? Kelola Kamar<br className="hidden sm:block" /> dan Temukan Penyewa.
              </h2>

              {/* 3. Supporting text */}
              <p className="text-emerald-100/90 text-sm leading-relaxed mb-5 max-w-md mx-auto md:mx-0">
                Pasang listing, kelola kamar, dan pantau booking langsung dari KosFinder.
              </p>

              {/* 4. Feature benefits row */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-2 mb-7">
                {[
                  { icon: Building2,  label: 'Pasang Listing' },
                  { icon: KeyRound,   label: 'Kelola Kamar' },
                  { icon: UserCheck,  label: 'Temukan Penyewa' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-100/90 leading-none">
                    <Icon className="w-4 h-4 text-emerald-300 flex-shrink-0" strokeWidth={2} />
                    {label}
                  </span>
                ))}
              </div>

              {/* 5 + 6. CTA group — flex row, baseline-aligned */}
              <div className="flex flex-row flex-wrap items-center justify-center md:justify-start gap-x-5 gap-y-3">
                {/* Primary CTA */}
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-800 font-bold text-sm rounded-xl shadow-md hover:bg-emerald-50 hover:shadow-lg active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-700 flex-shrink-0"
                >
                  Daftarkan Kos Sekarang
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>

                {/* Secondary CTA — text link, same line */}
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 text-sm font-medium text-emerald-100 hover:text-white transition-colors duration-150 group focus-visible:outline-none focus-visible:underline flex-shrink-0"
                >
                  <span>Sudah punya akun?</span>
                  <span className="font-semibold">Masuk Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>
              </div>

            </div>

            {/* RIGHT: KosFinder Owner Product Dashboard Preview */}
            <div className="flex-shrink-0 flex items-center justify-center w-full md:w-auto mt-4 md:mt-0">
              <svg
                viewBox="0 0 340 250"
                xmlns="http://www.w3.org/2000/svg"
                className="w-64 sm:w-72 md:w-84 lg:w-96 h-auto select-none"
                aria-hidden="true"
              >
                <defs>
                  {/* Ambient spotlight glow */}
                  <radialGradient id="p-halo" cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="rgba(167,243,208,0.20)" />
                    <stop offset="70%" stopColor="rgba(52,211,153,0.04)" />
                    <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                  </radialGradient>

                  {/* Building facade gradients */}
                  <linearGradient id="p-bldg-front" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#F8FAFC" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                  <linearGradient id="p-bldg-side" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#CBD5E1" />
                    <stop offset="100%" stopColor="#94A3B8" />
                  </linearGradient>

                  {/* Window warm lighting */}
                  <linearGradient id="p-win-warm" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#FEF08A" />
                    <stop offset="100%" stopColor="#F59E0B" />
                  </linearGradient>
                  {/* Window mint lighting */}
                  <linearGradient id="p-win-mint" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A7F3D0" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>

                  {/* Card shadow filter */}
                  <filter id="p-shadow" x="-10%" y="-10%" width="125%" height="125%">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#022C22" floodOpacity="0.35" />
                  </filter>
                </defs>

                {/* ── 1. AMBIENT GLOW & ORBIT ACCENTS ── */}
                <ellipse cx="170" cy="130" rx="130" ry="100" fill="url(#p-halo)" />
                <circle cx="170" cy="130" r="115" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="5,5" fill="none" />

                {/* ── 2. SECONDARY: MODERN KOS BUILDING (Partially behind dashboard on left) ── */}
                <g opacity="0.95">
                  {/* Roof Deck Overhang */}
                  <polygon points="44,48 136,48 148,40 56,40" fill="#064E3B" />
                  <polygon points="44,48 136,48 136,52 44,52" fill="#047857" />
                  <line x1="44" y1="48" x2="56" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <line x1="56" y1="40" x2="148" y2="40" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

                  {/* Main Building Facade */}
                  <rect x="48" y="52" width="88" height="138" rx="4" fill="url(#p-bldg-front)" />

                  {/* Perspective Side Wall */}
                  <polygon points="136,52 148,44 148,184 136,190" fill="url(#p-bldg-side)" />
                  {/* Side architectural slats */}
                  <line x1="140" y1="50" x2="140" y2="186" stroke="#059669" strokeWidth="1.2" opacity="0.5" />
                  <line x1="144" y1="47" x2="144" y2="184" stroke="#059669" strokeWidth="1.2" opacity="0.5" />

                  {/* Floor 3 (Top Floor) */}
                  <rect x="56" y="60" width="24" height="20" rx="2.5" fill="url(#p-win-warm)" />
                  <line x1="68" y1="60" x2="68" y2="80" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
                  <rect x="88" y="60" width="24" height="20" rx="2.5" fill="url(#p-win-warm)" />
                  <line x1="100" y1="60" x2="100" y2="80" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
                  <line x1="48" y1="88" x2="136" y2="88" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Floor 2 (Middle Floor) */}
                  <rect x="56" y="96" width="24" height="20" rx="2.5" fill="url(#p-win-warm)" />
                  <line x1="68" y1="96" x2="68" y2="116" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
                  <rect x="88" y="96" width="24" height="20" rx="2.5" fill="url(#p-win-mint)" />
                  <line x1="100" y1="96" x2="100" y2="116" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
                  {/* Cantilever balcony */}
                  <rect x="54" y="108" width="28" height="10" rx="2" fill="rgba(255,255,255,0.3)" stroke="#94A3B8" strokeWidth="0.8" />
                  <line x1="48" y1="124" x2="136" y2="124" stroke="#CBD5E1" strokeWidth="1" />

                  {/* Floor 1 (Ground Entrance) */}
                  <rect x="56" y="132" width="20" height="22" rx="2" fill="url(#p-win-warm)" />
                  {/* Modern Glass Entrance Door */}
                  <rect x="86" y="130" width="28" height="30" rx="3" fill="#0F172A" opacity="0.85" />
                  <rect x="88" y="132" width="24" height="26" rx="2" fill="url(#p-win-warm)" opacity="0.9" />
                  <line x1="100" y1="132" x2="100" y2="158" stroke="#1E293B" strokeWidth="1" />
                  <rect x="98" y="144" width="1" height="4" rx="0.5" fill="#10B981" />
                  <rect x="101" y="144" width="1" height="4" rx="0.5" fill="#10B981" />
                  {/* Canopy */}
                  <rect x="82" y="128" width="36" height="2.5" rx="1" fill="#047857" />

                  {/* Building Base Shadow */}
                  <ellipse cx="92" cy="194" rx="44" ry="5" fill="rgba(0,30,10,0.30)" />
                </g>

                {/* ── 3. MAIN HERO: KOSFINDER OWNER DASHBOARD CARD (Foreground) ── */}
                <g filter="url(#p-shadow)">
                  {/* Card Background */}
                  <rect x="108" y="58" width="214" height="166" rx="14" fill="#FFFFFF" stroke="rgba(226,232,240,0.9)" strokeWidth="1" />

                  {/* ── Header ── */}
                  <rect x="108" y="58" width="214" height="34" rx="14" fill="#FFFFFF" />
                  <rect x="108" y="78" width="214" height="14" fill="#FFFFFF" />
                  <line x1="108" y1="92" x2="322" y2="92" stroke="#F1F5F9" strokeWidth="1" />

                  {/* Brand Icon & Title */}
                  <rect x="120" y="67" width="18" height="18" rx="5" fill="#ECFDF5" />
                  {/* Mini building/dashboard logo glyph */}
                  <path d="M124 79 V72 L129 69 L134 72 V79 H124 Z" fill="#10B981" />
                  <rect x="127" y="75" width="4" height="4" rx="0.5" fill="#FFFFFF" />

                  <text x="144" y="79.5" fill="#0F172A" fontSize="10.5" fontWeight="700" fontFamily="Inter, sans-serif">
                    Dashboard Pemilik
                  </text>

                  {/* Live Status Chip */}
                  <rect x="268" y="67" width="44" height="17" rx="8.5" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.8" />
                  <circle cx="276" cy="75.5" r="2.5" fill="#10B981" />
                  <text x="282" y="78.5" fill="#047857" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif">
                    LIVE
                  </text>

                  {/* ── Top Metrics Row ── */}
                  {/* Block 1: Status Kamar (12 Total, 8 Terisi, 4 Kosong) */}
                  <rect x="118" y="100" width="104" height="62" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
                  <text x="126" y="111" fill="#64748B" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif">
                    STATUS KAMAR
                  </text>
                  <text x="126" y="126" fill="#0F172A" fontSize="13.5" fontWeight="800" fontFamily="Inter, sans-serif">
                    8 <tspan fill="#94A3B8" fontSize="9" fontWeight="500">/ 12</tspan>
                  </text>

                  {/* Occupancy Progress Bar */}
                  <rect x="126" y="132" width="88" height="4.5" rx="2.25" fill="#E2E8F0" />
                  <rect x="126" y="132" width="58" height="4.5" rx="2.25" fill="#10B981" />

                  {/* Sub-status tags */}
                  <circle cx="129" cy="146.5" r="2.2" fill="#10B981" />
                  <text x="134" y="149" fill="#334155" fontSize="7" fontWeight="600" fontFamily="Inter, sans-serif">
                    8 Terisi
                  </text>
                  <circle cx="172" cy="146.5" r="2.2" fill="#34D399" />
                  <text x="177" y="149" fill="#64748B" fontSize="7" fontWeight="500" fontFamily="Inter, sans-serif">
                    4 Tersedia
                  </text>

                  {/* Block 2: Booking Baru (3 Permintaan) */}
                  <rect x="228" y="100" width="84" height="62" rx="8" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
                  <text x="236" y="111" fill="#64748B" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif">
                    BOOKING
                  </text>
                  <text x="236" y="126" fill="#059669" fontSize="13.5" fontWeight="800" fontFamily="Inter, sans-serif">
                    3 Baru
                  </text>

                  {/* Notification Action Chip */}
                  <rect x="234" y="133" width="72" height="16" rx="4" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="0.6" />
                  <circle cx="241" cy="141" r="2" fill="#10B981" />
                  <text x="246" y="143.5" fill="#047857" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">
                    Perlu Respon
                  </text>

                  {/* ── Bottom Section: Visual Room Occupancy Grid ── */}
                  <rect x="118" y="169" width="194" height="44" rx="8" fill="#F1F5F9" />
                  <text x="126" y="179.5" fill="#475569" fontSize="7.5" fontWeight="700" fontFamily="Inter, sans-serif">
                    DENAH KAMAR REAL-TIME
                  </text>

                  {/* Room indicators: 6 green occupied rooms + 2 available rooms */}
                  <g transform="translate(126, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">01</text>
                  </g>
                  <g transform="translate(149.5, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">02</text>
                  </g>
                  <g transform="translate(173, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">03</text>
                  </g>
                  <g transform="translate(196.5, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">04</text>
                  </g>
                  <g transform="translate(220, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">05</text>
                  </g>
                  <g transform="translate(243.5, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">06</text>
                  </g>
                  <g transform="translate(267, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" strokeDasharray="2,1.5" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">07</text>
                  </g>
                  <g transform="translate(290.5, 184)">
                    <rect width="19" height="18" rx="3.5" fill="#FFFFFF" stroke="#10B981" strokeWidth="0.8" strokeDasharray="2,1.5" />
                    <text x="9.5" y="12" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="700" fontFamily="Inter, sans-serif">08</text>
                  </g>
                </g>

                {/* ── 4. SUPPORTING FLOATING CHIPS (Only 2 Clean Elements) ── */}
                {/* Chip 1: Top-Right — "Kos Terverifikasi" */}
                <g transform="translate(210, 36)">
                  <rect x="1" y="1" width="98" height="24" rx="12" fill="rgba(0,30,10,0.30)" />
                  <rect x="0" y="0" width="98" height="24" rx="12" fill="rgba(6,78,59,0.92)" stroke="rgba(167,243,208,0.50)" strokeWidth="1" />
                  <circle cx="12" cy="12" r="6.5" fill="#10B981" />
                  <path d="M9 12 L11 14 L15 10" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <text x="23" y="15" fill="#FFFFFF" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                    Kos Terverifikasi
                  </text>
                </g>

                {/* Chip 2: Bottom-Left — "8 Kamar Terisi" */}
                <g transform="translate(36, 188)">
                  <rect x="1" y="1" width="92" height="24" rx="12" fill="rgba(0,30,10,0.25)" />
                  <rect x="0" y="0" width="92" height="24" rx="12" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                  <circle cx="12" cy="12" r="6.5" fill="#ECFDF5" />
                  {/* Mini key icon */}
                  <path d="M10 11 A2.2 2.2 0 1 0 12.2 8.8 L15 11.6 V13 H13.6 V12.2 Z" stroke="#059669" strokeWidth="1" fill="none" />
                  <text x="22" y="15" fill="#0F172A" fontSize="8" fontWeight="700" fontFamily="Inter, sans-serif">
                    8 Kamar Terisi
                  </text>
                </g>
              </svg>
            </div>

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
