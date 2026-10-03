import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import KosCard, { formatRupiah } from '../components/KosCard.jsx';
import KosCardSkeleton from '../components/KosCardSkeleton.jsx';
import SearchFilters, { POPULAR_RULES } from '../components/SearchFilters.jsx';
import {
  Search, SlidersHorizontal, X, MapPin, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { POPULAR_CITIES, CAMPUS_CHIPS } from '../data/campuses.js';

const RESULTS_PER_PAGE = 6;

const EMPTY_FILTERS = {
  search: '',
  kota: '',
  campus: '',
  type: '',
  minPrice: '',
  maxPrice: '',
  availableOnly: false,
  minRating: '',
  facilities: [],
  rules: []
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'popular', label: 'Paling Populer' },
  { value: 'price-asc', label: 'Harga Termurah' },
  { value: 'price-desc', label: 'Harga Termahal' },
  { value: 'rating-desc', label: 'Rating Tertinggi' }
];

const readFiltersFromUrl = (params) => ({
  search: params.get('search') || '',
  kota: params.get('kota') || '',
  // `landmark` adalah nama parameter lama, tetap diterima supaya link lama jalan.
  campus: params.get('campus') || params.get('landmark') || '',
  type: params.get('type') || '',
  minPrice: params.get('minPrice') || '',
  maxPrice: params.get('maxPrice') || '',
  availableOnly: params.get('availableOnly') === 'true',
  minRating: params.get('minRating') || '',
  facilities: params.get('facilities') ? params.get('facilities').split(',') : [],
  rules: params.get('rules') ? params.get('rules').split(',') : []
});

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => readFiltersFromUrl(searchParams));
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [kosList, setKosList] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const setFilter = (key, value) => setFilters((prev) => ({ ...prev, [key]: value }));
  const toggleIn = (key, value) => setFilters((prev) => ({
    ...prev,
    [key]: prev[key].includes(value) ? prev[key].filter((v) => v !== value) : [...prev[key], value]
  }));
  const resetFilters = () => setFilters(EMPTY_FILTERS);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Drawer mobile: Escape menutup, fokus dipindah ke panel, scroll halaman dikunci.
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!mobileFilterOpen) return undefined;
    drawerRef.current?.focus();
    const onKeyDown = (e) => { if (e.key === 'Escape') setMobileFilterOpen(false); };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileFilterOpen]);

  const filterSignature = JSON.stringify([debouncedSearch, filters, sortBy]);
  const prevSignatureRef = useRef(filterSignature);

  useEffect(() => {
    // Perubahan filter saat tidak di halaman 1 mulai ulang dari halaman 1 tanpa
    // fetch ganda: efek ini jalan lagi dipicu perubahan `page`.
    if (prevSignatureRef.current !== filterSignature) {
      prevSignatureRef.current = filterSignature;
      if (page !== 1) {
        setPage(1);
        return;
      }
    }

    setLoading(true);

    const params = new URLSearchParams();
    if (debouncedSearch) params.append('search', debouncedSearch);
    if (filters.kota) params.append('kota', filters.kota);
    if (filters.campus) params.append('campus', filters.campus);
    if (filters.type) params.append('type', filters.type);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.availableOnly) params.append('availableOnly', 'true');
    if (filters.minRating) params.append('minRating', filters.minRating);
    if (filters.facilities.length) params.append('facilities', filters.facilities.join(','));
    if (filters.rules.length) params.append('rules', filters.rules.join(','));
    if (sortBy) params.append('sort', sortBy);
    params.append('page', String(page));
    params.append('limit', String(RESULTS_PER_PAGE));

    setSearchParams(params, { replace: true });

    api.get(`/kos?${params.toString()}`)
      .then((res) => {
        if (res.data.success) {
          const list = res.data.data || [];
          setKosList(list);
          setTotalResults(res.data.pagination?.total ?? list.length);
          setTotalPages(res.data.pagination?.totalPages ?? 1);
        }
      })
      .catch((err) => {
        console.error('Error fetching search results:', err);
        setKosList([]);
        setTotalResults(0);
        setTotalPages(1);
      })
      .finally(() => setLoading(false));
  }, [filterSignature, page]);

  const goToPage = (target) => {
    const next = Math.min(Math.max(1, target), totalPages);
    if (next === page) return;
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    let start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
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
  }, [page, totalPages]);

  const activeFilters = [];
  if (debouncedSearch) activeFilters.push({ label: `Kata kunci: "${debouncedSearch}"`, clear: () => setFilter('search', '') });
  if (filters.kota) activeFilters.push({ label: `Kota: ${POPULAR_CITIES.find((c) => c.id === filters.kota)?.name || filters.kota}`, clear: () => setFilter('kota', '') });
  if (filters.campus) {
    const matched = CAMPUS_CHIPS.find((c) => c.id === filters.campus);
    activeFilters.push({ label: `Area: ${matched?.name || filters.campus}`, clear: () => setFilter('campus', '') });
  }
  if (filters.type) activeFilters.push({ label: `Tipe: ${filters.type}`, clear: () => setFilter('type', '') });
  if (filters.minPrice) activeFilters.push({ label: `Min: ${formatRupiah(filters.minPrice)}`, clear: () => setFilter('minPrice', '') });
  if (filters.maxPrice) activeFilters.push({ label: `Maks: ${formatRupiah(filters.maxPrice)}`, clear: () => setFilter('maxPrice', '') });
  if (filters.availableOnly) activeFilters.push({ label: 'Kamar tersedia saja', clear: () => setFilter('availableOnly', false) });
  if (filters.minRating) activeFilters.push({ label: `Rating ${filters.minRating}+`, clear: () => setFilter('minRating', '') });
  filters.facilities.forEach((f) => activeFilters.push({ label: f, clear: () => toggleIn('facilities', f) }));
  filters.rules.forEach((key) => {
    const rule = POPULAR_RULES.find((r) => r.key === key);
    activeFilters.push({ label: rule?.label || key, clear: () => toggleIn('rules', key) });
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900">
          Cari Tempat Tinggal Kos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Bandingkan harga, fasilitas, lokasi kampus, dan ketersediaan kamar secara transparan
        </p>
      </div>

      {/* ================= CHIP KAMPUS / PUSAT KOTA ================= */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-slate-500 mb-2">
          Pilihan populer dekat kampus &amp; pusat kota
        </p>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CAMPUS_CHIPS.map((preset) => {
            const Icon = preset.id ? GraduationCap : MapPin;
            const areaText = preset.city ? `${preset.area}, ${preset.city}` : preset.area;
            const isActive = filters.campus === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setFilter('campus', preset.id)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                <span>{preset.name}</span>
                <span className={`hidden sm:inline text-[11px] font-normal ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {areaText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* ================= SIDEBAR FILTER (lg ke atas) ================= */}
        <aside className="hidden lg:block lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
          <h2 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2 mb-5">
            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
            <span>Filter</span>
          </h2>
          <SearchFilters filters={filters} setFilter={setFilter} toggleIn={toggleIn} onReset={resetFilters} />
        </aside>

        {/* ================= HASIL ================= */}
        <div className="lg:col-span-3 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                {loading ? 'Memuat data kos…' : `${totalResults} kos ditemukan`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {!loading && totalResults > 0
                  ? `Menampilkan ${(page - 1) * RESULTS_PER_PAGE + 1}–${(page - 1) * RESULTS_PER_PAGE + kosList.length} dari ${totalResults}`
                  : 'Gunakan filter untuk mempersempit hasil'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 py-2 px-3 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter{activeFilters.length > 0 ? ` (${activeFilters.length})` : ''}</span>
              </button>
              <label className="flex items-center gap-2 text-xs text-slate-500">
                <span className="whitespace-nowrap">Urutkan</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="py-2 px-2.5 text-xs font-medium text-slate-700 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {activeFilters.map((chip) => (
                <span
                  key={chip.label}
                  className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                >
                  <span>{chip.label}</span>
                  <button
                    type="button"
                    onClick={chip.clear}
                    aria-label={`Hapus ${chip.label}`}
                    className="p-0.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-900 underline underline-offset-2 ml-1"
              >
                Hapus semua
              </button>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: RESULTS_PER_PAGE }, (_, i) => <KosCardSkeleton key={i} />)}
            </div>
          ) : kosList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {kosList.map((kos) => (
                <KosCard key={kos.id} kos={kos} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-slate-900 text-base mb-1">
                Tidak ada kos yang cocok
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-sm mx-auto">
                Coba longgarkan rentang harga atau buang beberapa filter untuk melihat lebih banyak opsi.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Buang semua filter</span>
              </button>
            </div>
          )}

          {!loading && totalPages > 1 && (
            <nav aria-label="Navigasi halaman hasil" className="flex items-center justify-center gap-1.5 pt-2">
              <button
                type="button"
                onClick={() => goToPage(page - 1)}
                disabled={page <= 1}
                aria-label="Halaman sebelumnya"
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </button>

              {pageNumbers.map((p, idx) => (
                p === '...' ? (
                  <span key={`dots-${idx}`} aria-hidden="true" className="px-1.5 text-xs text-slate-400 select-none">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToPage(p)}
                    aria-current={p === page ? 'page' : undefined}
                    className={`min-w-[36px] px-3 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      p === page
                        ? 'bg-emerald-700 text-white border-emerald-700'
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
                aria-label="Halaman berikutnya"
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </nav>
          )}
        </div>
      </div>

      {/* ================= DRAWER FILTER (mobile) ================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilterOpen(false)} aria-hidden="true" />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Filter pencarian"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-full max-w-xs bg-white p-5 overflow-y-auto overscroll-contain flex flex-col focus:outline-none"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-heading font-bold text-slate-900 text-sm flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>Filter</span>
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Tutup filter"
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1">
              <SearchFilters filters={filters} setFilter={setFilter} toggleIn={toggleIn} onReset={resetFilters} />
            </div>

            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              className="mt-6 w-full py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
            >
              Lihat {totalResults} hasil
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
