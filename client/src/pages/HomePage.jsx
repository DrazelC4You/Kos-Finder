import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import KosCard from '../components/KosCard.jsx';
import KosCardSkeleton from '../components/KosCardSkeleton.jsx';
import SearchDropdown from '../components/SearchDropdown.jsx';
import IndonesiaMap from '../components/IndonesiaMap.jsx';
import { FaqSection } from '../components/FaqSection.jsx';
import {
  Search, MapPin, Banknote, Home, CheckCircle2, Shield,
  ArrowRight, Users, Sparkles,
  GraduationCap, CalendarCheck,
  Compass, Loader2, X, AlertCircle, MapPinOff
} from 'lucide-react';
import {
  DEFAULT_CAMPUS_PRESETS,
  sortRecommendationsByLocation,
  requestUserLocation
} from '../utils/geolocation.js';

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

// Kota pada section destinasi (semua ada di data kartu kota) + koordinat peta
const MAP_CITY_LOCATIONS = [
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, labelSide: 'above' },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191, labelSide: 'below' },
  { name: 'Purwokerto', lat: -7.4297, lng: 109.2341, labelSide: 'below', labelDy: 21 },
  { name: 'Semarang', lat: -6.9932, lng: 110.4203, labelSide: 'above' },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695, labelSide: 'below', labelDy: 26 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521, labelSide: 'above' },
  { name: 'Malang', lat: -7.9666, lng: 112.6326, labelSide: 'below' },
  { name: 'Bali', lat: -8.65, lng: 115.217, labelSide: 'below' },
];

// Koneksi dekoratif antar kota yang ada (bukan rute)
const MAP_CITY_CONNECTIONS = [
  { from: 'Jakarta', to: 'Bandung' },
  { from: 'Jakarta', to: 'Yogyakarta' },
  { from: 'Yogyakarta', to: 'Surabaya' },
  { from: 'Jakarta', to: 'Purwokerto' },
  { from: 'Surabaya', to: 'Bali' },
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
          className="hidden sm:flex absolute -left-3 lg:-left-12 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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
          className="hidden sm:flex absolute -right-3 lg:-right-12 z-10 items-center justify-center w-9 h-9 rounded-full bg-white/80 border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
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

// Dibakar saat build (VITE_SUPPORT_EMAIL). Blok kontak FAQ tidak dirender
// selama nilai ini kosong, jadi alamatnya cukup diisi kalau sudah resmi.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

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

  // Campus & Location recommendations state
  const [campusList, setCampusList] = useState(DEFAULT_CAMPUS_PRESETS);
  const [userCoords, setUserCoords] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // 'idle' | 'loading' | 'active' | 'error'
  const [locationError, setLocationError] = useState('');

  // Handle requesting user location (only triggered on user interaction)
  const handleRequestLocation = async () => {
    setLocationStatus('loading');
    setLocationError('');
    try {
      const coords = await requestUserLocation();
      setUserCoords(coords);
      setLocationStatus('active');
    } catch (err) {
      setLocationStatus('error');
      setLocationError(err.message || 'Gagal mendeteksi lokasi.');
    }
  };

  // Reset to default popular campus view
  const handleResetLocation = () => {
    setUserCoords(null);
    setLocationStatus('idle');
    setLocationError('');
  };

  // Calculate distance & sort recommendations when user coordinates are available
  const { nearby, isOutsideCoverage } = useMemo(() => {
    return sortRecommendationsByLocation(campusList, userCoords, 150);
  }, [campusList, userCoords]);

  // Display top 4 nearest campuses if location active & within coverage, else default 4
  const displayedCampuses = useMemo(() => {
    if (locationStatus === 'active' && !isOutsideCoverage && nearby.length > 0) {
      return nearby.slice(0, 4);
    }
    return campusList.slice(0, 4);
  }, [locationStatus, isOutsideCoverage, nearby, campusList]);

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

    // Fetch and sync campus landmarks from backend if available
    api.get('/kos/landmarks')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const backendLandmarks = res.data.data;
          setCampusList((prev) => {
            const merged = [...prev];
            backendLandmarks.forEach((b) => {
              const existingIdx = merged.findIndex((m) => m.id === b.id);
              if (existingIdx >= 0) {
                merged[existingIdx] = {
                  ...merged[existingIdx],
                  latitude: b.lat ?? b.latitude ?? merged[existingIdx].latitude,
                  longitude: b.lng ?? b.longitude ?? merged[existingIdx].longitude,
                  name: merged[existingIdx].name || b.nama,
                  full: merged[existingIdx].full || b.nama,
                  area: merged[existingIdx].area || b.area
                };
              }
            });
            return merged;
          });
        }
      })
      .catch(() => {
        // Keep DEFAULT_CAMPUS_PRESETS
      });
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
      question: 'Apakah mencari kos di KosFinder dipungut biaya?',
      answer: 'Tidak sama sekali! KosFinder 100% gratis untuk pencari kos. Anda dapat mencari, melihat detail, dan menghubungi pemilik tanpa biaya perantara.'
    },
    {
      question: 'Bagaimana cara menghubungi pemilik kos?',
      answer: 'Pada halaman detail kos, klik tombol "Hubungi / Chat Pemilik" untuk langsung membuka template chat atau kontak pemilik kos terkait.'
    },
    {
      question: 'Bagaimana cara mendaftarkan kos saya sebagai pemilik?',
      answer: 'Daftar akun baru dengan memilih peran "Pemilik Kos (Owner)". Setelah masuk, Anda dapat langsung mendaftarkan properti dan mengelola ketersediaan kamar.'
    },
    {
      question: 'Apakah ketersediaan kamar di KosFinder selalu terbarui?',
      answer: 'Ya, pemilik kos memperbarui status kamar secara berkala dan sistem secara otomatis menghitung jumlah kamar yang siap huni.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-50 pt-12 pb-16 border-b border-slate-100">
        {/* Latar peta Indonesia bertitik — dekoratif, non-interaktif (aria-hidden + pointer-events-none).
            Proporsi peta sudah dipadatkan ke rasio Indonesia sebenarnya di dalam
            IndonesiaMap (Y_SQUASH), jadi tingginya tidak pernah melebihi hero:
            - < lg: terpusat dengan lebar terkontrol (94%/420 -> 460 -> 720px). Nilai
              top- dipilih supaya pita peta jatuh di tengah blok headline (di 390px
              headline menempati y 94-244, peta 90px -> top 124px; di 768px peta
              178px -> top 77px), tidak menabrak badge maupun paragraf.
            - lg ke atas: full-bleed (w-full menyentuh tepi viewport). Jangkar atasnya
              calc(390px - 20.58vw), bukan centering: 0.834 x 0.24674 adalah posisi
              bawah band Jawa sebagai fraksi lebar viewport, jadi garis Jawa selalu
              berhenti ~10px di atas search card berapa pun lebarnya layarnya.
              (Di 1024 -> top 179px, praktis sama dengan centering; di 1920 -> -5px;
              di 2560 -> -137px, yang terpotong cuma laut/utara Sumatra yang kosong.)
            - Jawa tetap aksen hijau di tengah-bawah; topeng radial di dalam SVG mengikuti
              posisinya, bukan posisi headline. */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
          <IndonesiaMap
          className="absolute top-[124px] left-1/2 -translate-x-1/2 w-[94%] max-w-[420px] h-auto sm:top-[96px] sm:max-w-[460px] md:top-[77px] md:w-[720px] md:max-w-none lg:top-[calc(390px-20.58vw)] lg:left-0 lg:translate-x-0 lg:w-full"
            locations={MAP_CITY_LOCATIONS}
            connections={MAP_CITY_CONNECTIONS}
            lineColor="#10b981"
            showLabels={false}
            markerOpacity={0.55}
            animationDuration={3}
            loop={true}
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
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
              img: '/cities/yogyakarta.jpg'
            },
            {
              nama: 'Bandung',
              query: 'Bandung',
              tagline: 'Kota Kembang • ITB, UNPAD',
              img: '/cities/bandung.jpg'
            },
            {
              nama: 'Jakarta Selatan',
              query: 'Jakarta Selatan',
              tagline: 'Pusat Bisnis • Tebet, Kuningan',
              img: '/cities/jakarta.jpg'
            },
            {
              nama: 'Malang',
              query: 'Malang',
              tagline: 'Kota Sejuk • UB, UM, Polinema',
              img: '/cities/malang.jpg'
            },
            {
              nama: 'Surabaya',
              query: 'Surabaya',
              tagline: 'Kota Pahlawan • UNAIR, ITS',
              img: '/cities/surabaya.jpg'
            },
            {
              nama: 'Semarang',
              query: 'Semarang',
              tagline: 'Kota Atlas • UNDIP, UNNES',
              img: '/cities/semarang.jpg'
            },
            {
              nama: 'Bali (Denpasar)',
              query: 'Denpasar',
              tagline: 'Pulau Dewata • Udayana, Renon',
              img: '/cities/bali.jpg'
            },
            {
              nama: 'Purwokerto',
              query: 'Purwokerto',
              tagline: 'Kota Satria • UNSOED, UMP',
              img: '/cities/purwokerto.jpg'
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
        <p className="text-[10px] text-slate-400 mt-3 text-right">
          Foto landmark kota: Wikimedia Commons (lisensi Creative Commons)
        </p>
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1.5">
                Lokasi Favorit Mahasiswa
              </span>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-white tracking-tight">
                  Cari Kos Dekat <span className="text-emerald-400">Kampusmu</span>
                </h2>
                <div
                  className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 text-emerald-400"
                  aria-hidden="true"
                >
                  <GraduationCap className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl">
                {locationStatus === 'active' && !isOutsideCoverage
                  ? 'Akses cepat ke kos-kosan strategis di sekitar universitas terdekat dari lokasi Anda.'
                  : 'Akses cepat ke kos-kosan strategis di sekitar universitas terkemuka di Indonesia.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Location Status / Action Pill */}
              {locationStatus === 'loading' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/30 text-xs font-medium text-emerald-300 shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>Mencari lokasi Anda...</span>
                </div>
              ) : locationStatus === 'active' ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs font-medium text-emerald-300 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Menggunakan lokasi Anda</span>
                  <button
                    onClick={handleResetLocation}
                    title="Reset ke rekomendasi default"
                    className="text-slate-400 hover:text-white ml-1 p-0.5 rounded transition-colors"
                    aria-label="Reset lokasi"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-emerald-300 hover:text-emerald-200 border border-white/10 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Gunakan Lokasi Saya</span>
                </button>
              )}

              {/* Jelajahi Semua Area link */}
              <Link
                to="/cari"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 hover:underline transition-colors py-1.5"
              >
                <span>Jelajahi Semua Area</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Location Error / Denied Notice */}
          {locationStatus === 'error' && (
            <div className="mb-6 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 animate-dropdown">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>{locationError}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRequestLocation}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-medium text-xs transition-colors flex-shrink-0"
                >
                  Coba Lagi
                </button>
                <button
                  type="button"
                  onClick={() => setLocationStatus('idle')}
                  className="text-amber-300/80 hover:text-white p-1"
                  aria-label="Tutup pemberitahuan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Outside Coverage Fallback State */}
          {locationStatus === 'active' && isOutsideCoverage ? (
            <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-8 sm:p-10 text-center max-w-lg mx-auto shadow-xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3.5">
                <MapPinOff className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-white text-base sm:text-lg mb-1.5">
                Belum ada kos di sekitar lokasi Anda
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                KosFinder saat ini berfokus pada area kampus di Pulau Jawa dan Bali. Anda tetap dapat menjelajahi seluruh area atau melihat rekomendasi kampus favorit kami.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleResetLocation}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                >
                  Tampilkan Semua Kampus
                </button>
                <Link
                  to="/cari"
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-xl text-xs font-semibold transition-colors border border-white/10"
                >
                  Jelajahi Semua Area
                </Link>
              </div>
            </div>
          ) : (
            /* Campus Recommendation Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayedCampuses.map((c) => (
                <Link
                  key={c.id}
                  to={`/cari?campus=${c.id}`}
                  className={`p-5 rounded-2xl bg-gradient-to-br ${c.bg} border transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                        <GraduationCap className="w-5 h-5 text-emerald-300" />
                      </div>
                      {c.distanceText && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold flex-shrink-0">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {c.distanceText}
                        </span>
                      )}
                    </div>
                    <h3 className="font-heading font-bold text-base text-white group-hover:text-emerald-300 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-[11px] text-slate-300 mt-0.5">{c.full}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-emerald-300 font-semibold">
                    <span className="text-slate-400 font-normal text-[11px] truncate mr-2">{c.area}</span>
                    <span className="group-hover:translate-x-1 transition-transform inline-flex items-center gap-1 flex-shrink-0">
                      <span>Lihat Kos</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
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
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-16 items-start">

            {/* Kicker + headline */}
            <div className="lg:col-span-7">
              <p className="flex items-center gap-3 text-sm font-medium text-emerald-700 mb-5">
                <span className="h-px w-8 bg-emerald-600" aria-hidden="true" />
                Untuk Pemilik Kos
              </p>
              <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-balance text-slate-900 max-w-[18ch]">
                Punya Kos? Kelola Kamar dan Temukan Penyewa.
              </h2>
            </div>

            {/* Paragraf pendukung + CTA */}
            <div className="lg:col-span-5 lg:pt-1">
              <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-md">
                Pasang listing, kelola kamar, dan pantau booking langsung dari KosFinder.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 sm:gap-5">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
                >
                  Daftarkan Kos Sekarang
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:underline"
                >
                  <span>Sudah punya akun?</span>
                  <span className="font-medium">Masuk Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION */}
      <FaqSection
        title="Pertanyaan Umum (FAQ)"
        description="Jawaban atas pertanyaan yang sering diajukan"
        items={faqs}
        contactInfo={SUPPORT_EMAIL ? {
          title: 'Masih ada pertanyaan?',
          description: 'Tim kami siap membantu Anda menemukan kos yang pas.',
          buttonText: 'Hubungi KosFinder',
          href: `mailto:${SUPPORT_EMAIL}`,
        } : undefined}
      />
    </div>
  );
}
