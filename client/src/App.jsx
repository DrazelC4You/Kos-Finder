import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Heart, Shield, LogIn, UserPlus, LogOut, Building, MessageSquare, Search, LayoutGrid, X } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
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

        {/* User Auth Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              {/* Notification Bell Component */}
              <NotificationBell />

              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2 py-1 px-2.5 bg-slate-100 hover:bg-slate-200/80 rounded-full border border-slate-200 transition-colors"
                title="Buka Dashboard"
                aria-label="Buka Dashboard"
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full bg-slate-200 object-cover"
                />
                {/* Nama + role hanya di xl ke atas; di bawahnya chip memakan jatah
                    yang dibutuhkan 7 link nav. */}
                <div className="hidden xl:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight max-w-[140px] truncate">{user.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase leading-none">
                    {isOwner ? 'Pemilik Kos' : isTenant ? 'Pencari Kos' : 'Admin'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg border border-red-200 transition-colors"
                title="Keluar dari akun"
                aria-label="Keluar"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-600 py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden min-[360px]:inline">Masuk</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-3.5 rounded-lg shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden min-[320px]:inline">Daftar</span>
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>

    {/* Bar navigasi bawah melayang. Sengaja sibling setelah </header>, bukan
        anak dari header: header sticky z-50 membuat stacking context sendiri.
        z-40 supaya modal dan drawer filter (z-50) tetap menutupinya. */}
    <nav aria-label="Navigasi utama" className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="animate-nav-bar mx-3 mb-3 rounded-2xl border border-white/70 bg-white/75 backdrop-blur-xl shadow-[0_-2px_28px_rgba(15,23,42,0.12)]">
        <div className="relative grid grid-cols-4 py-2">
          <span
            aria-hidden="true"
            className="nav-pill absolute top-2 bottom-2 left-0 w-1/4"
            style={{ transform: `translateX(${Math.max(0, pillIndex) * 100}%)`, opacity: pillIndex < 0 ? 0 : 1 }}
          >
            <span className="block h-full mx-1.5 rounded-xl bg-emerald-600/10 ring-1 ring-inset ring-emerald-600/25" />
          </span>

          {primaryItems.map((item, idx) => {
            const Icon = item.icon;
            const isActive = idx === pillIndex;
            const cls = `relative z-10 flex flex-col items-center gap-1 py-1.5 text-[10px] font-semibold transition-transform duration-150 active:scale-90 ${
              isActive ? 'text-emerald-700' : 'text-slate-500'
            }`;
            return item.to ? (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cls}
              >
                <Icon className="w-5 h-5" />
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
              >
                <Icon className="w-5 h-5" />
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

          <div className="px-5 py-4 border-b border-slate-100">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-11 h-11 rounded-full bg-slate-100 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase">
                    {isOwner ? 'Pemilik Kos' : isTenant ? 'Pencari Kos' : 'Admin'}
                  </p>
                </div>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setOpenNav(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-emerald-700 whitespace-nowrap"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  onClick={() => setOpenNav(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-center text-xs font-semibold text-slate-700"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpenNav(false)}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-center text-xs font-semibold text-white"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>

          <nav className="p-3 space-y-0.5">
            {navItems.map(({ to, label, icon: Icon, iconClass, linkClass = '' }, idx) => (
              <Link
                key={to}
                to={to}
                onClick={() => setOpenNav(false)}
                className={`animate-sheet-item flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition-colors ${linkClass}`}
                style={{ animationDelay: `${60 + idx * 26}ms` }}
              >
                {Icon ? (
                  <Icon className={`w-4 h-4 ${iconClass || 'text-slate-400'}`} />
                ) : (
                  <span className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          {isAuthenticated && (
            <div className="px-3 pb-6">
              <button
                type="button"
                onClick={() => { setOpenNav(false); handleLogout(); }}
                style={{ animationDelay: `${60 + navItems.length * 26}ms` }}
                className="animate-sheet-item flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar</span>
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
        <footer className="bg-white border-t border-slate-200 pt-8 pb-28 lg:pb-8 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 font-heading font-extrabold text-base text-slate-900">
              <span className="text-emerald-600">KosFinder</span>
              <span className="text-slate-400 font-normal">| Temukan Tempat Tinggal yang Tepat</span>
            </div>
            <p>© 2026 KosFinder Platform. Dibuat dengan arsitektur Full-Stack modular.</p>
          </div>
        </footer>
      </div>
    </AuthProvider>
  );
}
