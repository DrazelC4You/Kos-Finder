import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Home, Heart, Shield, LogIn, UserPlus, LogOut, Building, MessageSquare } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import HomePage from './pages/HomePage.jsx';
import KosDetailPage from './pages/KosDetailPage.jsx';
import SearchPage from './pages/SearchPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.jsx';
import ResetPasswordPage from './pages/ResetPasswordPage.jsx';
import VerifyEmailPage from './pages/VerifyEmailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import OwnerLandingPage from './pages/OwnerLandingPage.jsx';
import TenantDashboardPage from './pages/TenantDashboardPage.jsx';
import OwnerDashboardPage from './pages/OwnerDashboardPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AdminDashboardPage from './pages/AdminDashboardPage.jsx';
import NotificationBell from './components/NotificationBell.jsx';

function Navbar() {
  const { user, isAuthenticated, logout, isOwner, isTenant, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (isOwner) return '/owner/dashboard';
    if (isAdmin) return '/admin';
    return '/tenant/dashboard';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-xl text-slate-900">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-600/20">
            <Home className="w-4 h-4" />
          </div>
          <span>Kos<span className="text-emerald-600">Finder</span></span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-emerald-600 transition-colors">Beranda</Link>
          <Link to="/cari" className="hover:text-emerald-600 transition-colors">Cari Kos</Link>
          <Link to="/untuk-pemilik" className="hover:text-emerald-600 transition-colors">Untuk Pemilik</Link>
          <Link to="/tentang" className="hover:text-emerald-600 transition-colors">Tentang</Link>
          <Link to="/tenant/dashboard?tab=favorit" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-slate-400" />
            <span>Favorit</span>
          </Link>
          {isAuthenticated && (
            <Link to="/chat" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Chat</span>
            </Link>
          )}
          {isTenant && (
            <Link to="/tenant/dashboard" className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-emerald-700 font-semibold">
              <span>Dashboard Saya</span>
            </Link>
          )}
          {isOwner && (
            <Link to="/owner/dashboard" className="hover:text-emerald-600 transition-colors flex items-center gap-1 text-emerald-700 font-semibold">
              <Building className="w-3.5 h-3.5" />
              <span>Dashboard Pemilik</span>
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="hover:text-purple-600 transition-colors flex items-center gap-1 text-purple-700 font-semibold">
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
            </Link>
          )}
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
              >
                <img
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-6 h-6 rounded-full bg-slate-200 object-cover"
                />
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-800 leading-tight">{user.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase leading-none">
                    {isOwner ? 'Pemilik Kos' : isTenant ? 'Pencari Kos' : 'Admin'}
                  </span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 py-1.5 px-3 rounded-lg border border-red-200 transition-colors"
                title="Keluar dari akun"
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
                <span>Masuk</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-3.5 rounded-lg shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Daftar</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1">
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
          </Routes>
        </main>
        <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
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
