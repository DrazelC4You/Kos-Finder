import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Heart, Shield, LogOut, Building, MessageSquare, Search,
  LayoutGrid, X, LayoutDashboard, History, ClipboardList, BedDouble, Star,
  Wallet, UserRound, FileText, ChevronRight
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import api from './services/api.js';
import NotificationBell from './components/NotificationBell.jsx';
import RouteFallback from './components/RouteFallback.jsx';
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx';

// Chunk per rute: Leaflet hanya dibutuhkan halaman detail kos, framer-motion
// hanya beranda, dan tiga dasbor tidak pernah dibuka pengunjung anonim.
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const KosDetailPage = lazy(() => import('./pages/KosDetailPage.jsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage.jsx'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage.jsx'));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage.jsx'));
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'));
const OwnerLandingPage = lazy(() => import('./pages/OwnerLandingPage.jsx'));
const TenantDashboardPage = lazy(() => import('./pages/TenantDashboardPage.jsx'));
const OwnerDashboardPage = lazy(() => import('./pages/OwnerDashboardPage.jsx'));
const ChatPage = lazy(() => import('./pages/ChatPage.jsx'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage.jsx'));

// Dibakar saat build. Kalau kosong, baris email dukungan tidak dirender di footer.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';

// Isi sheet "Menu": khusus tujuan yang TIDAK ada di bar bawah. `countKey`
// merujuk ke field stats dari dasbor peran yang bersangkutan, jadi angkanya
// berasal dari data nyata — bukan hiasan.
const ROLE_MENU = {
  tenant: {
    statsUrl: '/tenant/dashboard',
    stats: [
      { key: 'activeBookings', label: 'aktif' },
      { key: 'pendingBookings', label: 'menunggu' },
      { key: 'totalFavorites', label: 'favorit' }
    ],
    rows: [
      { to: '/tenant/dashboard?tab=ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
      { to: '/tenant/dashboard?tab=riwayat', label: 'Riwayat booking', icon: History, countKey: 'pendingBookings' },
      { to: '/tenant/dashboard?tab=favorit', label: 'Favorit', icon: Heart, countKey: 'totalFavorites' },
      { to: '/tenant/dashboard?tab=pembayaran', label: 'Pembayaran', icon: Wallet },
      { to: '/tenant/dashboard?tab=profil', label: 'Profil', icon: UserRound }
    ]
  },
  owner: {
    statsUrl: '/owner/dashboard',
    stats: [
      { key: 'totalProperties', label: 'properti' },
      { key: 'availableRooms', label: 'kamar kosong' },
      { key: 'pendingBookings', label: 'permintaan' }
    ],
    rows: [
      { to: '/owner/dashboard?tab=ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
      { to: '/owner/dashboard?tab=kos', label: 'Daftar properti', icon: Building, countKey: 'totalProperties' },
      { to: '/owner/dashboard?tab=booking', label: 'Permintaan booking', icon: ClipboardList, countKey: 'pendingBookings' },
      { to: '/owner/dashboard?tab=kamar', label: 'Kelola kamar', icon: BedDouble, countKey: 'availableRooms' },
      { to: '/owner/dashboard?tab=pembayaran', label: 'Keuangan', icon: Wallet },
      { to: '/owner/dashboard?tab=ulasan', label: 'Ulasan & rating', icon: Star }
    ]
  },
  admin: {
    statsUrl: null,
    stats: [],
    rows: [{ to: '/admin', label: 'Admin Panel', icon: Shield }]
  }
};

const EXPLORE_ROWS = [
  { to: '/untuk-pemilik', label: 'Untuk Pemilik', icon: Building },
  { to: '/tentang', label: 'Tentang KosFinder', icon: FileText }
];

function Navbar() {
  const { user, isAuthenticated, logout, isOwner, isTenant, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openNav, setOpenNav] = useState(false);
  const panelRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (isOwner) return '/owner/dashboard';
    if (isAdmin) return '/admin';
    return '/tenant/dashboard';
  };

  // Satu sumber kebenaran untuk bar desktop dan sheet mobile, supaya keduanya
  // tidak bisa berbeda daftar maupun gating role.
  const navItems = [
    { to: '/', label: 'Beranda' },
    { to: '/cari', label: 'Cari Kos' },
    { to: '/untuk-pemilik', label: 'Untuk Pemilik' },
    { to: '/tentang', label: 'Tentang' },
    { to: '/tenant/dashboard?tab=favorit', label: 'Favorit', icon: Heart, iconClass: 'text-slate-400' },
    isAuthenticated && { to: '/chat', label: 'Chat', icon: MessageSquare, iconClass: 'text-emerald-600' },
    isTenant && { to: '/tenant/dashboard', label: 'Dashboard Saya', linkClass: 'text-emerald-700 font-semibold' },
    isOwner && { to: '/owner/dashboard', label: 'Dashboard Pemilik', icon: Building, linkClass: 'text-emerald-700 font-semibold' },
    isAdmin && { to: '/admin', label: 'Admin Panel', icon: Shield, hoverClass: 'hover:text-purple-600', linkClass: 'text-purple-700 font-semibold' },
  ].filter(Boolean);

  // location.key, bukan pathname: Favorit dan tab dashboard hanya mengubah query,
  // jadi pathname-nya tetap sama dan menu akan nyangkut terbuka.
  useEffect(() => {
    setOpenNav(false);
  }, [location.key]);

  useEffect(() => {
    if (!openNav) return;
    panelRef.current?.focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpenNav(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openNav]);

  // Bar bawah: tiga tujuan + satu pembuka menu. Label sengaja lebih pendek
  // dari navItems karena tiap sel cuma punya ~90px di lebar 390px.
  const primaryItems = [
    { key: 'beranda', to: '/', label: 'Beranda', icon: Home, active: (p) => p === '/' },
    { key: 'cari', to: '/cari', label: 'Cari Kos', icon: Search, active: (p) => p.startsWith('/cari') || p.startsWith('/kos/') },
    isAuthenticated
      ? { key: 'chat', to: '/chat', label: 'Chat', icon: MessageSquare, active: (p) => p.startsWith('/chat') }
      : { key: 'pemilik', to: '/untuk-pemilik', label: 'Pemilik', icon: Building, active: (p) => p.startsWith('/untuk-pemilik') || p.startsWith('/tentang') },
    { key: 'menu', label: 'Menu', icon: LayoutGrid }
  ];
  const pillIndex = openNav ? 3 : primaryItems.findIndex((item) => item.active?.(location.pathname));

  // Angka di sheet diambil saat sheet dibuka, bukan saat halaman dimuat,
  // supaya chrome entry tidak menahan data dasbor.
  const roleMenu = isAdmin ? ROLE_MENU.admin : isOwner ? ROLE_MENU.owner : ROLE_MENU.tenant;
  const [menuStats, setMenuStats] = useState(null);

  useEffect(() => {
    if (!openNav || !isAuthenticated) return undefined;
    if (!roleMenu.statsUrl) { setMenuStats(null); return undefined; }
    let alive = true;
    setMenuStats(null);
    api.get(roleMenu.statsUrl)
      .then((res) => { if (alive && res.data?.success) setMenuStats(res.data.data?.stats || null); })
      .catch(() => { if (alive) setMenuStats(null); });
    return () => { alive = false; };
  }, [openNav, isAuthenticated, roleMenu]);

  // Bar bawah sudah memuat salah satu tujuan Jelajah untuk tamu; jangan ulangi.
  const exploreRows = EXPLORE_ROWS.filter((row) => !primaryItems.some((p) => p.to === row.to));

  return (
    <>
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-xl text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20">
            <Home className="w-4 h-4" />
          </div>
          <span>Kos<span className="text-emerald-600">Finder</span></span>
        </Link>

        {/* Navigation Links — lg ke atas. whitespace-nowrap penting: tanpa itu bar
            yang terlihat "muat" sebenarnya diam-diam membungkus, dan itu menutupi
            kenyataan bahwa 7 link tidak cukup ruang di bawah ~1024px. */}
        <nav className="hidden lg:flex items-center gap-6 whitespace-nowrap text-sm font-medium text-slate-600">
          {navItems.map(({ to, label, icon: Icon, iconClass, hoverClass = 'hover:text-emerald-600', linkClass = '' }) => (
            <Link key={to} to={to} className={`${hoverClass} transition-colors flex items-center gap-1 ${linkClass}`}>
              {Icon && <Icon className={`w-3.5 h-3.5 ${iconClass || ''}`} />}
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Cluster kanan. Di bawah lg perannya dipegang sheet "Menu" pada bar
            bawah (kartu akun + deep link + Keluar), jadi header mobile cukup
            brand + lonceng — tidak mengulang diri sendiri. */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Notification Bell Component */}
              <NotificationBell />

              <Link
                to={getDashboardPath()}
                aria-label={`Buka dashboard ${user.name}`}
                className="hidden lg:flex items-center gap-2.5 pl-1 py-1 pr-1 xl:pr-3 rounded-full hover:bg-slate-100 transition-colors"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt=""
                  className="w-8 h-8 rounded-full bg-slate-100 object-cover"
                />
                <span className="hidden xl:inline text-xs font-semibold text-slate-700 max-w-[140px] truncate">{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="hidden lg:flex items-center gap-1.5 pl-3 py-1.5 text-xs font-medium text-slate-500 border-l border-slate-200 hover:text-red-600 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </>
          ) : (
            <>
              {/* Untuk tamu, masuk/daftar tetap satu sentuhan dari header mobile —
                aksi paling bernilai sebelum punya akun. Daftar lengkap ada di
                sheet "Menu". */}
              <Link
                to="/login"
                className="lg:hidden px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Masuk
              </Link>
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                >
                  Daftar
                </Link>
              </div>
            </>
          )}

        </div>
      </div>
    </header>

    {/* Bar navigasi bawah melayang. Sengaja sibling setelah </header>, bukan
        anak dari header: header sticky z-50 membuat stacking context sendiri.
        z-40 supaya modal dan drawer filter (z-50) tetap menutupinya.
        Padding bawah dibungkus di <nav> (bukan mb-3 di dalam) supaya
        env(safe-area-inset-bottom) ikut menambah jarak di atas home indicator.
        Label diam pakai slate-600, bukan 500: di atas kaca 60% kontras terburuk
        label 4,13:1 di /cari dan 4,51:1 di beranda (ambang teks kecil 4,5:1);
        dengan 600 semuanya 6,58-7,35:1 di tiga latar yang diukur. */}
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-40 lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="animate-nav-bar mx-3 rounded-2xl border border-slate-900/[0.06] bg-white/60 backdrop-blur-xl shadow-[0_4px_24px_rgba(15,23,42,0.10)]">
        <div className="relative grid grid-cols-4 py-2">
          {/* Lingkaran lembut di belakang ikon, bukan kotak seukuran sel: kotak
              dengan ring-inset adalah bentuk template "glass navbar". */}
          <span
            aria-hidden="true"
            className="nav-pill absolute top-[7px] left-0 w-1/4"
            style={{ transform: `translateX(${Math.max(0, pillIndex) * 100}%)`, opacity: pillIndex < 0 ? 0 : 1 }}
          >
            <span className="mx-auto block h-9 w-9 rounded-full bg-emerald-600/[0.12]" />
          </span>

          {primaryItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = idx === pillIndex;
            const cls = `animate-nav-item relative z-10 flex flex-col items-center gap-1 py-1.5 text-[10px] transition-all duration-200 active:scale-95 ${
              isActive ? 'text-emerald-800 font-semibold' : 'text-slate-600 font-medium'
            }`;
            const iconCls = `w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-[1.06]' : ''}`;
            const stagger = { animationDelay: `${40 + idx * 30}ms` };
            return item.to ? (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cls}
                style={stagger}
              >
                <Icon className={iconCls} />
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.key}
                type="button"
                onClick={() => setOpenNav((v) => !v)}
                aria-expanded={openNav}
                aria-controls="mobile-nav"
                aria-label="Buka menu navigasi"
                className={cls}
                style={stagger}
              >
                <Icon className={iconCls} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>

    {openNav && (
      <div className="fixed inset-0 z-[60] lg:hidden">
        <div
          className="animate-backdrop absolute inset-0 bg-slate-900/45"
          onClick={() => setOpenNav(false)}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          id="mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu navigasi"
          tabIndex={-1}
          className="animate-sheet-up absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.25)] focus:outline-none"
        >
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur pt-3 px-5 pb-3 border-b border-slate-100">
            <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-3" aria-hidden="true" />
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-slate-900 text-base">Menu</span>
              <button
                type="button"
                onClick={() => setOpenNav(false)}
                aria-label="Tutup menu"
                className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {isAuthenticated ? (
            <div className="mx-4 mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-11 h-11 flex-shrink-0 rounded-full bg-white object-cover ring-2 ring-emerald-200"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    {isOwner ? 'Pemilik Kos' : isAdmin ? 'Admin' : 'Pencari Kos'}
                  </p>
                </div>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setOpenNav(false)}
                  className="flex-shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-700 hover:text-white hover:ring-emerald-700"
                >
                  Dashboard
                </Link>
              </div>

              {roleMenu.stats.length > 0 && menuStats && (
                <div className="mt-4 grid grid-cols-3 divide-x divide-emerald-100 rounded-xl bg-white/70 py-2.5">
                  {roleMenu.stats.map((s) => (
                    <div key={s.key} className="px-1 text-center">
                      <p className="font-heading text-lg font-bold leading-none text-slate-900 tabular-nums">
                        {menuStats[s.key] ?? 0}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="mx-4 mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">Belum masuk</p>
              <p className="mt-0.5 mb-3 text-xs text-slate-500">
                Simpan favorit dan ajukan sewa langsung dari aplikasi.
              </p>
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpenNav(false)}
                  className="flex-1 rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpenNav(false)}
                  className="flex-1 rounded-lg bg-emerald-700 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Daftar
                </Link>
              </div>
            </div>
          )}

          {isAuthenticated && (
            <div className="px-4 pt-5">
              <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {isAdmin ? 'Moderasi' : 'Kelola akun'}
              </p>
              <ul className="space-y-0.5">
                {roleMenu.rows.map((row, idx) => {
                  const Icon = row.icon;
                  const count = row.countKey && menuStats ? menuStats[row.countKey] : null;
                  const isCurrent = `${location.pathname}${location.search}` === row.to;
                  return (
                    <li key={row.to}>
                      <Link
                        to={row.to}
                        onClick={() => setOpenNav(false)}
                        aria-current={isCurrent ? 'page' : undefined}
                        style={{ animationDelay: `${50 + idx * 24}ms` }}
                        className={`animate-sheet-item flex items-center gap-3 rounded-xl px-2 py-2 transition-colors ${
                          isCurrent ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.label}</span>
                        {count > 0 && (
                          <span className="flex-shrink-0 rounded-full bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-emerald-700">
                            {count}
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-300" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          <div className="px-4 pt-5">
            <p className="px-1 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Jelajah</p>
            <ul className="space-y-0.5">
              {exploreRows.map((row, idx) => {
                const Icon = row.icon;
                return (
                  <li key={row.to}>
                    <Link
                      to={row.to}
                      onClick={() => setOpenNav(false)}
                      style={{ animationDelay: `${50 + (roleMenu.rows.length + idx) * 24}ms` }}
                      className="animate-sheet-item flex items-center gap-3 rounded-xl px-2 py-2 text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{row.label}</span>
                      <ChevronRight className="w-4 h-4 flex-shrink-0 text-slate-300" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {isAuthenticated && (
            <div className="px-4 pt-5 pb-[max(1.75rem,calc(env(safe-area-inset-bottom)_+_1rem))]">
              <button
                type="button"
                onClick={() => { setOpenNav(false); handleLogout(); }}
                style={{ animationDelay: `${50 + (roleMenu.rows.length + exploreRows.length) * 24}ms` }}
                className="animate-sheet-item flex w-full items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-left">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}

function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <p className="text-6xl font-extrabold font-heading text-slate-200">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-900">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Halaman yang kamu cari mungkin sudah dipindahkan atau tidak lagi tersedia.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          Kembali ke Beranda
        </Link>
        <Link
          to="/cari"
          className="inline-flex items-center px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 transition-colors"
        >
          Cari Kos
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
          <RouteErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cari" element={<SearchPage />} />
                <Route path="/kos/:id" element={<KosDetailPage />} />
                <Route path="/tenant/dashboard" element={<TenantDashboardPage />} />
                <Route path="/tenant" element={<TenantDashboardPage />} />
                <Route path="/favorit" element={<TenantDashboardPage />} />
                <Route path="/owner/dashboard" element={<OwnerDashboardPage />} />
                <Route path="/owner" element={<OwnerDashboardPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/tentang" element={<AboutPage />} />
                <Route path="/untuk-pemilik" element={<OwnerLandingPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </RouteErrorBoundary>
        </main>
        <footer className="bg-white border-t border-slate-200 pt-12 pb-28 lg:pb-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 gap-x-6 gap-y-9 pb-10 sm:grid-cols-12">
              <div className="col-span-2 sm:col-span-6">
                <Link to="/" className="inline-flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
                    <Home className="w-4 h-4" />
                  </span>
                  <span className="font-heading font-extrabold text-base text-slate-900">
                    Kos<span className="text-emerald-600">Finder</span>
                  </span>
                </Link>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-500">
                  Platform pencarian dan pengelolaan kos: listing terverifikasi, harga transparan,
                  dan komunikasi langsung dengan pemilik properti.
                </p>
              </div>

              <div className="sm:col-span-3">
                <p className="text-xs font-semibold text-slate-900 mb-3">Jelajah</p>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/cari" className="text-slate-500 hover:text-emerald-700 transition-colors">Cari Kos</Link></li>
                  <li><Link to="/untuk-pemilik" className="text-slate-500 hover:text-emerald-700 transition-colors">Untuk Pemilik</Link></li>
                  <li><Link to="/register" className="text-slate-500 hover:text-emerald-700 transition-colors">Daftar Akun</Link></li>
                </ul>
              </div>

              <div className="sm:col-span-3">
                <p className="text-xs font-semibold text-slate-900 mb-3">Bantuan</p>
                <ul className="space-y-2 text-sm">
                  <li><Link to="/tentang" className="text-slate-500 hover:text-emerald-700 transition-colors">Tentang KosFinder</Link></li>
                  <li><Link to="/login" className="text-slate-500 hover:text-emerald-700 transition-colors">Masuk</Link></li>
                  {SUPPORT_EMAIL && (
                    <li>
                      <a
                        href={`mailto:${SUPPORT_EMAIL}`}
                        className="text-slate-500 hover:text-emerald-700 transition-colors"
                      >
                        {SUPPORT_EMAIL}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} KosFinder. Seluruh hak cipta dilindungi.</p>
              <p>Harga dan ketersediaan kamar ditampilkan apa adanya dari pemilik properti.</p>
            </div>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
