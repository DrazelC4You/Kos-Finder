import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import KosCard, { formatRupiah } from '../components/KosCard.jsx';
import KosCardSkeleton from '../components/KosCardSkeleton.jsx';
import {
  Search, SlidersHorizontal, RotateCcw, X, MapPin,
  Bed, GraduationCap, Shield, Coffee, Car, ChevronLeft, ChevronRight
} from 'lucide-react';

// ================================================================
// PHASE 13: CATEGORIZED AMENITIES & CAMPUS LANDMARK PRESETS
// ================================================================

const POPULAR_CITIES = [
  { id: '', label: 'Semua Kota (Indonesia)' },
  { id: 'Yogyakarta', label: 'Yogyakarta' },
  { id: 'Bandung', label: 'Bandung' },
  { id: 'Surabaya', label: 'Surabaya' },
  { id: 'Jakarta Selatan', label: 'Jakarta Selatan' },
  { id: 'Depok', label: 'Depok' },
  { id: 'Malang', label: 'Malang' },
  { id: 'Semarang', label: 'Semarang' },
  { id: 'Denpasar', label: 'Denpasar / Bali' },
  { id: 'Purwokerto', label: 'Purwokerto' }
];

// `label` hanya nama kampus; kota diletakkan di `area` supaya tidak menumpuk
// di judul dan satu kota tidak dominan di seluruh chip.
const CAMPUS_PRESETS = [
  { id: '', label: 'Semua Area', area: 'Seluruh Indonesia', icon: MapPin },
  { id: 'ugm', label: 'UGM & UNY', area: 'Bulaksumur, Jogja', icon: GraduationCap },
  { id: 'itb', label: 'ITB & UNPAD', area: 'Dago & Dipatiukur, Bandung', icon: GraduationCap },
  { id: 'ui', label: 'UI', area: 'Margonda, Depok & Salemba', icon: GraduationCap },
  { id: 'unair', label: 'UNAIR & ITS', area: 'Gubeng & Sukolilo, Surabaya', icon: GraduationCap },
  { id: 'ub', label: 'UB & UM', area: 'Suhat, Malang', icon: GraduationCap },
  { id: 'undip', label: 'UNDIP', area: 'Tembalang, Semarang', icon: GraduationCap },
  { id: 'bali', label: 'Udayana', area: 'Renon & Jimbaran, Bali', icon: GraduationCap },
  { id: 'unsoed', label: 'UNSOED', area: 'Grendeng, Purwokerto', icon: GraduationCap },
  { id: 'ump', label: 'UMP', area: 'Dukuhwaluh, Purwokerto', icon: GraduationCap },
  { id: 'telkom', label: 'Telkom University', area: 'Purwokerto Selatan', icon: GraduationCap },
  { id: 'uinsaizu', label: 'UIN Saizu', area: 'Karangkobar, Purwokerto', icon: GraduationCap }
];

const FACILITY_CATEGORIES = [
  {
    id: 'kamar',
    title: 'Fasilitas Kamar',
    icon: Bed,
    items: ['AC', 'Kamar mandi dalam', 'Kasur', 'Lemari', 'Meja & Kursi', 'WiFi', 'Listrik']
  },
  {
    id: 'bersama',
    title: 'Fasilitas Bersama',
    icon: Coffee,
    items: ['Dapur Bersama', 'Kulkas Bersama', 'Ruang Tamu', 'Mesin Cuci']
  },
  {
    id: 'parkir_keamanan',
    title: 'Parkir & Keamanan',
    icon: Car,
    items: ['Parkir', 'Akses 24 Jam', 'CCTV']
  }
];

const POPULAR_RULES = [
  { key: '24jam', label: 'Akses Bebas 24 Jam', desc: 'Tanpa jam malam gerbang' },
  { key: 'pasutri', label: 'Boleh Pasutri', desc: 'Menerima pasangan suami istri' },
  { key: 'bebas_asap', label: 'Bebas Asap Rokok', desc: 'Kamar dilarang merokok' }
];

const RESULTS_PER_PAGE = 6;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('search') || '');
  const [city, setCity] = useState(searchParams.get('kota') || '');
  const [campus, setCampus] = useState(searchParams.get('campus') || searchParams.get('landmark') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [availableOnly, setAvailableOnly] = useState(searchParams.get('availableOnly') === 'true');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [selectedFacilities, setSelectedFacilities] = useState(
    searchParams.get('facilities') ? searchParams.get('facilities').split(',') : []
  );
  const [selectedRules, setSelectedRules] = useState(
    searchParams.get('rules') ? searchParams.get('rules').split(',') : []
  );
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

  // Mobile Filter Drawer State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Result States
  const [kosList, setKosList] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [loading, setLoading] = useState(true);

  // Debounce search query (350ms)
  const debounceTimerRef = useRef(null);
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(debounceTimerRef.current);
  }, [searchQuery]);

  // Fetch results when filters, sorting, or page change
  const filterSignature = JSON.stringify([
    debouncedQuery, city, campus, type, minPrice, maxPrice,
    availableOnly, minRating, selectedFacilities, selectedRules, sortBy
  ]);
  const prevFilterRef = useRef(filterSignature);

  useEffect(() => {
    // Jika filter berubah saat tidak di halaman 1, kembali ke halaman 1 dulu
    // tanpa melakukan fetch ganda (fetch dipicu ulang oleh perubahan `page`).
    if (prevFilterRef.current !== filterSignature) {
      prevFilterRef.current = filterSignature;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedQuery) params.append('search', debouncedQuery);
    if (city) params.append('kota', city);
    if (campus) params.append('campus', campus);
    if (type) params.append('type', type);
    if (minPrice) params.append('minPrice', minPrice);
    if (maxPrice) params.append('maxPrice', maxPrice);
    if (availableOnly) params.append('availableOnly', 'true');
    if (minRating) params.append('minRating', minRating);
    if (selectedFacilities.length > 0) params.append('facilities', selectedFacilities.join(','));
    if (selectedRules.length > 0) params.append('rules', selectedRules.join(','));
    if (sortBy) params.append('sort', sortBy);
    params.append('page', String(page));
    params.append('limit', String(RESULTS_PER_PAGE));

    // Update URL query parameters
    setSearchParams(params, { replace: true });

    api.get(`/kos?${params.toString()}`)
      .then(res => {
        if (res.data.success) {
          const list = res.data.data || [];
          const pagination = res.data.pagination;
          setKosList(list);
          setTotalResults(pagination?.total ?? list.length);
          setTotalPages(pagination?.totalPages ?? 1);
        }
      })
      .catch(err => {
        console.error('Error fetching search results:', err);
        setKosList([]);
        setTotalResults(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [filterSignature, page]);

  // Facility Toggle Handler
  const handleFacilityChange = (fac) => {
    if (selectedFacilities.includes(fac)) {
      setSelectedFacilities(selectedFacilities.filter(f => f !== fac));
    } else {
      setSelectedFacilities([...selectedFacilities, fac]);
    }
  };

  // Rule Toggle Handler
  const handleRuleChange = (ruleKey) => {
    if (selectedRules.includes(ruleKey)) {
      setSelectedRules(selectedRules.filter(r => r !== ruleKey));
    } else {
      setSelectedRules([...selectedRules, ruleKey]);
    }
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setCity('');
    setCampus('');
    setType('');
    setMinPrice('');
    setMaxPrice('');
    setAvailableOnly(false);
    setMinRating('');
    setSelectedFacilities([]);
    setSelectedRules([]);
    setSortBy('newest');
  };

  // Pagination Handlers
  const goToPage = (target) => {
    const next = Math.min(Math.max(1, target), totalPages);
    if (next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    let start = Math.max(1, page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  // Active filters list for chips
  const activeFilters = [];
  if (debouncedQuery) activeFilters.push({ label: `Kata kunci: "${debouncedQuery}"`, clear: () => setSearchQuery('') });
  if (city) activeFilters.push({ label: `Kota: ${city}`, clear: () => setCity('') });
  if (campus) {
    const matched = CAMPUS_PRESETS.find(c => c.id === campus);
    activeFilters.push({ label: `Area: ${matched?.label || campus}`, clear: () => setCampus('') });
  }
  if (type) activeFilters.push({ label: `Tipe: ${type}`, clear: () => setType('') });
  if (minPrice) activeFilters.push({ label: `Min: ${formatRupiah(minPrice)}`, clear: () => setMinPrice('') });
  if (maxPrice) activeFilters.push({ label: `Maks: ${formatRupiah(maxPrice)}`, clear: () => setMaxPrice('') });
  if (availableOnly) activeFilters.push({ label: `Kamar Tersedia Saja`, clear: () => setAvailableOnly(false) });
  if (minRating) activeFilters.push({ label: `Rating ⭐ ${minRating}+`, clear: () => setMinRating('') });
  selectedFacilities.forEach(f => {
    activeFilters.push({ label: f, clear: () => handleFacilityChange(f) });
  });
  selectedRules.forEach(r => {
    const foundRule = POPULAR_RULES.find(x => x.key === r);
    activeFilters.push({ label: foundRule?.label || r, clear: () => handleRuleChange(r) });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Header Bar */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Cari Tempat Tinggal Kos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bandingkan harga, fasilitas, lokasi kampus, dan ketersediaan kamar secara transparan
        </p>
      </div>

      {/* ================= CAMPUS & LANDMARK QUICK PRESETS BAR ================= */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Pilihan Populer Dekat Kampus & Pusat Kota
          </span>
        </div>
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
          {CAMPUS_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = campus === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setCampus(preset.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                <span>{preset.label}</span>
                {preset.area && (
                  <span className={`text-[10px] hidden sm:inline ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                    ({preset.area})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ================= DESKTOP SIDEBAR FILTER ================= */}
        <aside className="hidden lg:block lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-20 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              <span>Filter Lengkap</span>
            </h3>
            {activeFilters.length > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="space-y-5">
            {/* Input Search Keyword */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Pencarian Kata Kunci
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nama kos / jalan..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            {/* Pilihan Kota Populer (Skala Nasional) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Kota / Wilayah di Indonesia
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white font-medium text-slate-800"
              >
                {POPULAR_CITIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Tipe Kos */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Tipe Penghuni
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Semua Tipe (Campur, Putri, Putra)</option>
                <option value="CAMPUR">Campur</option>
                <option value="PUTRI">Khusus Putri</option>
                <option value="PUTRA">Khusus Putra</option>
              </select>
            </div>

            {/* Rentang Harga */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rentang Harga (Rp/bulan)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min (0)"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  step="50000"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="number"
                  placeholder="Maksimal"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  step="50000"
                  className="w-full p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Kamar Tersedia Saja */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                />
                <span>Hanya yang masih ada kamar kosong</span>
              </label>
            </div>

            {/* Rating Minimal */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rating Minimal
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="">Semua Rating</option>
                <option value="4.0">⭐ 4.0 ke atas</option>
                <option value="4.5">⭐ 4.5 ke atas</option>
                <option value="4.8">⭐ 4.8 ke atas</option>
              </select>
            </div>

            {/* Peraturan Khusus Kos (Phase 13) */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aturan Kos Populer</span>
              </label>
              <div className="space-y-2">
                {POPULAR_RULES.map((rule) => (
                  <label key={rule.key} className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none hover:text-slate-900">
                    <input
                      type="checkbox"
                      checked={selectedRules.includes(rule.key)}
                      onChange={() => handleRuleChange(rule.key)}
                      className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-slate-800">{rule.label}</span>
                      <p className="text-[10px] text-slate-400">{rule.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Checklist Fasilitas Terkategori (Phase 13) */}
            <div className="pt-2 border-t border-slate-100 space-y-4">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Fasilitas Terkategori
              </label>

              {FACILITY_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <div key={cat.id} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <Icon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{cat.title}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {cat.items.map((fac) => (
                        <label key={fac} className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none hover:text-slate-900">
                          <input
                            type="checkbox"
                            checked={selectedFacilities.includes(fac)}
                            onChange={() => handleFacilityChange(fac)}
                            className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
                          />
                          <span>{fac}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        </aside>

        {/* ================= RESULTS MAIN CONTENT ================= */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Bar: Results Count & Sort Dropdown */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-heading font-bold text-slate-800 text-sm">
                Hasil Pencarian Kos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {loading
                  ? 'Memuat data kos...'
                  : totalResults > 0
                    ? `Menampilkan ${(page - 1) * RESULTS_PER_PAGE + 1}–${(page - 1) * RESULTS_PER_PAGE + kosList.length} dari ${totalResults} kos yang sesuai kriteria`
                    : 'Tidak ada kos yang sesuai kriteria'}
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile Filter Toggle Button */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex-1 sm:flex-initial py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter {activeFilters.length > 0 && `(${activeFilters.length})`}</span>
              </button>

              {/* Sorting Dropdown */}
              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <span className="text-xs text-slate-400 font-semibold whitespace-nowrap">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto p-2 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="newest">Terbaru</option>
                  <option value="popular">Paling Populer</option>
                  <option value="price-asc">Harga Termurah</option>
                  <option value="price-desc">Harga Termahal</option>
                  <option value="rating-desc">Rating Tertinggi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-400 font-medium">Filter Aktif:</span>
              {activeFilters.map((chip, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                >
                  <span>{chip.label}</span>
                  <button type="button" onClick={chip.clear} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-400 hover:text-slate-600 underline ml-1"
              >
                Hapus Semua
              </button>
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
              <KosCardSkeleton />
            </div>
          ) : kosList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kosList.map((kos) => (
                <KosCard key={kos.id} kos={kos} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-lg mb-1">
                Kos Tidak Ditemukan
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Coba ubah pilihan kampus, rentang harga, atau reset filter untuk melihat opsi kos lainnya di seluruh area.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {getPageNumbers().map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} className="px-1.5 text-xs text-slate-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    className={`min-w-[36px] px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      p === page
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-600/20'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                type="button"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ================= MOBILE FILTER DRAWER MODAL ================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end lg:hidden">
          <div className="w-full max-w-xs bg-white h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-heading font-bold text-slate-900 text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                  <span>Filter Kos</span>
                </h3>
                <button type="button" onClick={() => setMobileFilterOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Filter Form Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cari Kos / Lokasi</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nama kos / jalan..."
                    className="w-full p-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kota / Wilayah</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    {POPULAR_CITIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kampus / Area</label>
                  <select
                    value={campus}
                    onChange={(e) => setCampus(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    {CAMPUS_PRESETS.map((p) => (
                      <option key={p.id} value={p.id}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe Penghuni</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="CAMPUR">Campur</option>
                    <option value="PUTRI">Khusus Putri</option>
                    <option value="PUTRA">Khusus Putra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Harga Maksimal (Rp)</label>
                  <input
                    type="number"
                    placeholder="Contoh: 1000000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-slate-200"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-xs text-slate-700">
                    <input
                      type="checkbox"
                      checked={availableOnly}
                      onChange={(e) => setAvailableOnly(e.target.checked)}
                      className="accent-emerald-600"
                    />
                    <span>Hanya kamar tersedia</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white shadow-sm"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
