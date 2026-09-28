import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Shield, Users, Building, BarChart2, AlertTriangle, Star,
  Check, X, RefreshCw, Search, ChevronLeft, ChevronRight,
  Eye, Trash2, UserCheck, UserX, TrendingUp, FileText,
  CheckCircle, XCircle, Clock,
  Ban, BadgeCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const API = 'http://localhost:5000/api';

// -----------------------------------------------
// Helper: format rupiah
// -----------------------------------------------
const formatRupiah = (n) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n || 0);

// -----------------------------------------------
// Badge helpers
// -----------------------------------------------
function StatusBadge({ status }) {
  const map = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
    PENDING: 'bg-amber-100 text-amber-700 border-amber-200',
    REJECTED: 'bg-red-100 text-red-700 border-red-200',
    RESOLVED: 'bg-blue-100 text-blue-700 border-blue-200',
    DISMISSED: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  const label = {
    ACTIVE: 'Aktif', INACTIVE: 'Nonaktif', PENDING: 'Menunggu',
    REJECTED: 'Ditolak', RESOLVED: 'Selesai', DISMISSED: 'Diabaikan'
  };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {label[status] || status}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
    OWNER: 'bg-blue-100 text-blue-700 border-blue-200',
    TENANT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  const label = { ADMIN: 'Admin', OWNER: 'Pemilik', TENANT: 'Penyewa' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${map[role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {label[role] || role}
    </span>
  );
}

// -----------------------------------------------
// Stat Card
// -----------------------------------------------
function StatCard({ icon: Icon, label, value, sub, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-100',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${colors[color] || colors.slate}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// -----------------------------------------------
// Pagination
// -----------------------------------------------
function Pagination({ page, totalPages, onPrev, onNext }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button onClick={onPrev} disabled={page <= 1}
        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-sm text-slate-600 font-medium">Halaman {page} / {totalPages}</span>
      <button onClick={onNext} disabled={page >= totalPages}
        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ================================================================
// MAIN COMPONENT
// ================================================================
export default function AdminDashboardPage() {
  const { user, isAuthenticated, isAdmin, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Listings state
  const [listings, setListings] = useState([]);
  const [listingPage, setListingPage] = useState(1);
  const [listingTotalPages, setListingTotalPages] = useState(1);
  const [listingStatusFilter, setListingStatusFilter] = useState('');
  const [listingSearch, setListingSearch] = useState('');

  // Reports state
  const [reports, setReports] = useState([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotalPages, setReviewTotalPages] = useState(1);

  const [actionLoading, setActionLoading] = useState('');
  const [toast, setToast] = useState(null);

  // -----------------------------------------------
  // Guard: redirect if not admin
  // -----------------------------------------------
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isAdmin) { navigate('/'); return; }
  }, [isAuthenticated, isAdmin, authLoading, navigate]);

  const authHeaders = useCallback(() => ({
    headers: { Authorization: `Bearer ${token}` }
  }), [token]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // -----------------------------------------------
  // Fetch Functions
  // -----------------------------------------------
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API}/admin/stats`, authHeaders());
      setStats(data.data);
    } catch (e) { console.error(e); }
  }, [authHeaders]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: userPage, limit: 15 });
      if (userSearch) params.append('search', userSearch);
      if (userRoleFilter) params.append('role', userRoleFilter);
      const { data } = await axios.get(`${API}/admin/users?${params}`, authHeaders());
      setUsers(data.data?.data || []);
      setUserTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (e) { showToast('Gagal memuat pengguna', 'error'); }
    finally { setLoading(false); }
  }, [authHeaders, userPage, userSearch, userRoleFilter]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: listingPage, limit: 15 });
      if (listingStatusFilter) params.append('status', listingStatusFilter);
      if (listingSearch) params.append('search', listingSearch);
      const { data } = await axios.get(`${API}/admin/listings?${params}`, authHeaders());
      setListings(data.data?.data || []);
      setListingTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (e) { showToast('Gagal memuat listing', 'error'); }
    finally { setLoading(false); }
  }, [authHeaders, listingPage, listingStatusFilter, listingSearch]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: reportPage, limit: 15 });
      if (reportStatusFilter) params.append('status', reportStatusFilter);
      const { data } = await axios.get(`${API}/admin/reports?${params}`, authHeaders());
      setReports(data.data?.data || []);
      setReportTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (e) { showToast('Gagal memuat laporan', 'error'); }
    finally { setLoading(false); }
  }, [authHeaders, reportPage, reportStatusFilter]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: reviewPage, limit: 15 });
      const { data } = await axios.get(`${API}/admin/reviews?${params}`, authHeaders());
      setReviews(data.data?.data || []);
      setReviewTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (e) { showToast('Gagal memuat ulasan', 'error'); }
    finally { setLoading(false); }
  }, [authHeaders, reviewPage]);

  // -----------------------------------------------
  // Load on tab change
  // -----------------------------------------------
  useEffect(() => {
    if (!isAdmin) return;
    if (activeTab === 'overview') fetchStats();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'listings') fetchListings();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'reviews') fetchReviews();
  }, [activeTab, fetchStats, fetchUsers, fetchListings, fetchReports, fetchReviews, isAdmin]);

  // -----------------------------------------------
  // Action Handlers
  // -----------------------------------------------
  const handleVerifyListing = async (kosId, action, reason = '') => {
    setActionLoading(`listing-${kosId}-${action}`);
    try {
      await axios.patch(`${API}/admin/listings/${kosId}/verify`, { action, reason }, authHeaders());
      showToast(`Listing berhasil di-${action === 'approve' ? 'setujui' : action === 'reject' ? 'tolak' : 'tangguhkan'}`);
      fetchListings();
      fetchStats();
    } catch (e) { showToast(e.response?.data?.message || 'Gagal memproses', 'error'); }
    finally { setActionLoading(''); }
  };

  const handleUserRole = async (userId, role) => {
    setActionLoading(`user-role-${userId}`);
    try {
      await axios.patch(`${API}/admin/users/${userId}/role`, { role }, authHeaders());
      showToast(`Peran pengguna diubah ke ${role}`);
      fetchUsers();
    } catch (e) { showToast(e.response?.data?.message || 'Gagal mengubah peran', 'error'); }
    finally { setActionLoading(''); }
  };

  const handleUserStatus = async (userId, isVerified) => {
    setActionLoading(`user-status-${userId}`);
    try {
      await axios.patch(`${API}/admin/users/${userId}/status`, { isVerified }, authHeaders());
      showToast(`Akun ${isVerified ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchUsers();
    } catch (e) { showToast(e.response?.data?.message || 'Gagal mengubah status', 'error'); }
    finally { setActionLoading(''); }
  };

  const handleReportAction = async (reportId, action) => {
    setActionLoading(`report-${reportId}`);
    try {
      await axios.patch(`${API}/admin/reports/${reportId}`, { action }, authHeaders());
      showToast(`Laporan berhasil di-${action === 'resolve' ? 'selesaikan' : 'abaikan'}`);
      fetchReports();
    } catch (e) { showToast('Gagal memproses laporan', 'error'); }
    finally { setActionLoading(''); }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Hapus ulasan ini? Tindakan tidak dapat dibatalkan.')) return;
    setActionLoading(`review-${reviewId}`);
    try {
      await axios.delete(`${API}/admin/reviews/${reviewId}`, authHeaders());
      showToast('Ulasan berhasil dihapus');
      fetchReviews();
    } catch (e) { showToast('Gagal menghapus ulasan', 'error'); }
    finally { setActionLoading(''); }
  };

  // -----------------------------------------------
  // Render tab content
  // -----------------------------------------------

  // ── Tab: Overview ──
  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Statistik Platform</h2>
        <button onClick={fetchStats} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {!stats ? (
        <div className="text-center py-12 text-slate-400">Memuat statistik...</div>
      ) : (
        <>
          {/* User Stats */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pengguna</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Pengguna" value={stats.users.total} color="blue" />
              <StatCard icon={Users} label="Penyewa (Tenant)" value={stats.users.tenants} color="emerald" />
              <StatCard icon={Building} label="Pemilik Kos" value={stats.users.owners} color="purple" />
              <StatCard icon={Shield} label="Admin" value={stats.users.admins} color="slate" />
            </div>
          </div>

          {/* Kos Stats */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Listing Kos</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Building} label="Total Kos" value={stats.kos.total} color="blue" />
              <StatCard icon={CheckCircle} label="Aktif" value={stats.kos.active} color="emerald" />
              <StatCard icon={Clock} label="Menunggu Verifikasi" value={stats.kos.pending} color="amber" />
              <StatCard icon={BadgeCheck} label="Terverifikasi" value={stats.kos.verified} color="purple" />
            </div>
          </div>

          {/* Booking & Revenue Stats */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Transaksi & Revenue</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={FileText} label="Total Booking" value={stats.bookings.total} color="blue" />
              <StatCard icon={CheckCircle} label="Booking Aktif" value={stats.bookings.approved} color="emerald" />
              <StatCard icon={Clock} label="Booking Pending" value={stats.bookings.pending} color="amber" />
              <StatCard icon={TrendingUp} label="Estimasi Revenue"
                value={formatRupiah(stats.revenue.total)}
                sub="Dari booking approved + completed"
                color="emerald" />
            </div>
          </div>

          {/* Content Stats */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Konten & Moderasi</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard icon={Star} label="Total Ulasan" value={stats.reviews.total} color="amber" />
              <StatCard icon={AlertTriangle} label="Total Laporan" value={stats.reports.total} color="red" />
              <StatCard icon={Clock} label="Laporan Pending" value={stats.reports.pending} color="red" />
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Tab: Users ──
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="Cari nama atau email..."
            value={userSearch}
            onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          value={userRoleFilter}
          onChange={e => { setUserRoleFilter(e.target.value); setUserPage(1); }}
        >
          <option value="">Semua Peran</option>
          <option value="TENANT">Penyewa</option>
          <option value="OWNER">Pemilik</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button onClick={fetchUsers} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Search className="w-4 h-4" /> Cari
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Memuat...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Tidak ada pengguna ditemukan</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pengguna</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Peran</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Bergabung</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`}
                        alt={u.name}
                        className="w-8 h-8 rounded-full bg-slate-200 object-cover"
                      />
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${u.isVerified ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                      {u.isVerified ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== user?.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          className="text-xs px-2 py-1 border border-slate-200 rounded-lg"
                          value={u.role}
                          onChange={e => handleUserRole(u.id, e.target.value)}
                          disabled={actionLoading === `user-role-${u.id}`}
                        >
                          <option value="TENANT">Penyewa</option>
                          <option value="OWNER">Pemilik</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                        <button
                          onClick={() => handleUserStatus(u.id, !u.isVerified)}
                          disabled={actionLoading === `user-status-${u.id}`}
                          title={u.isVerified ? 'Nonaktifkan akun' : 'Aktifkan akun'}
                          className={`p-1.5 rounded-lg border transition-colors ${u.isVerified
                            ? 'border-red-200 text-red-500 hover:bg-red-50'
                            : 'border-green-200 text-green-600 hover:bg-green-50'}`}
                        >
                          {u.isVerified ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Akun Saya</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={userPage} totalPages={userTotalPages} onPrev={() => setUserPage(p => p - 1)} onNext={() => setUserPage(p => p + 1)} />
    </div>
  );

  // ── Tab: Listings ──
  const renderListings = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            placeholder="Cari nama kos, kota, alamat..."
            value={listingSearch}
            onChange={e => { setListingSearch(e.target.value); setListingPage(1); }}
          />
        </div>
        <select
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
          value={listingStatusFilter}
          onChange={e => { setListingStatusFilter(e.target.value); setListingPage(1); }}
        >
          <option value="">Semua Status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="PENDING">Menunggu</option>
          <option value="REJECTED">Ditolak</option>
          <option value="INACTIVE">Nonaktif</option>
        </select>
        <button onClick={fetchListings} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
          <Search className="w-4 h-4" /> Cari
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Memuat...</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Tidak ada listing ditemukan</div>
      ) : (
        <div className="space-y-3">
          {listings.map(kos => (
            <div key={kos.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                  {kos.foto?.[0] ? (
                    <img src={kos.foto[0]} alt={kos.nama} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Building className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{kos.nama}</h3>
                    <StatusBadge status={kos.status} />
                    {kos.isVerified && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" /> Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{kos.kota} • {kos.alamat}</p>
                  <p className="text-xs text-slate-400">
                    Pemilik: <span className="text-slate-600 font-medium">{kos.owner?.name || '—'}</span>
                    {' • '}{kos.owner?.email}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Harga: <span className="text-slate-700 font-semibold">{formatRupiah(kos.hargaBulanan)}/bln</span>
                    {' • '}Rating: {kos.rating?.toFixed(1) || '0.0'} ⭐
                  </p>
                </div>
                <div className="flex flex-wrap sm:flex-col gap-2 sm:items-end">
                  {kos.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleVerifyListing(kos.id, 'approve')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Setujui
                    </button>
                  )}
                  {kos.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleVerifyListing(kos.id, 'suspend', 'Pelanggaran kebijakan platform')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                    >
                      <Ban className="w-3.5 h-3.5" /> Tangguhkan
                    </button>
                  )}
                  {kos.status === 'PENDING' && (
                    <button
                      onClick={() => handleVerifyListing(kos.id, 'reject', 'Tidak memenuhi syarat platform')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Tolak
                    </button>
                  )}
                  <a
                    href={`/kos/${kos.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    <Eye className="w-3.5 h-3.5" /> Lihat
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={listingPage} totalPages={listingTotalPages} onPrev={() => setListingPage(p => p - 1)} onNext={() => setListingPage(p => p + 1)} />
    </div>
  );

  // ── Tab: Reports ──
  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['PENDING', 'RESOLVED', 'DISMISSED', ''].map(s => (
          <button
            key={s || 'all'}
            onClick={() => { setReportStatusFilter(s); setReportPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-colors ${reportStatusFilter === s
              ? 'bg-purple-600 text-white border-purple-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'}`}
          >
            {s === 'PENDING' ? 'Menunggu' : s === 'RESOLVED' ? 'Selesai' : s === 'DISMISSED' ? 'Diabaikan' : 'Semua'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Memuat...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Tidak ada laporan ditemukan</div>
      ) : (
        <div className="space-y-3">
          {reports.map(rpt => (
            <div key={rpt.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <StatusBadge status={rpt.status} />
                    <span className="text-xs text-slate-400">
                      {new Date(rpt.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 font-medium mb-1">"{rpt.reason}"</p>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>Pelapor: <span className="text-slate-600">{rpt.reporter?.name} ({rpt.reporter?.email})</span></p>
                    <p>Kos dilaporkan: <span className="text-slate-600">{rpt.kos?.nama} — {rpt.kos?.kota}</span></p>
                  </div>
                </div>
                {rpt.status === 'PENDING' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleReportAction(rpt.id, 'resolve')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Selesaikan
                    </button>
                    <button
                      onClick={() => handleReportAction(rpt.id, 'dismiss')}
                      disabled={!!actionLoading}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Abaikan
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={reportPage} totalPages={reportTotalPages} onPrev={() => setReportPage(p => p - 1)} onNext={() => setReportPage(p => p + 1)} />
    </div>
  );

  // ── Tab: Reviews (Moderasi) ──
  const renderReviews = () => (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-10 text-slate-400">Memuat...</div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Tidak ada ulasan</div>
      ) : (
        <div className="space-y-3">
          {reviews.map(rv => (
            <div key={rv.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <Star className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-1">
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < rv.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="text-xs font-semibold text-slate-700 ml-1">{rv.rating}/5</span>
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(rv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 mb-1">"{rv.comment}"</p>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>Penulis: <span className="text-slate-600">{rv.tenant?.name}</span></p>
                    <p>Kos: <span className="text-slate-600">{rv.kos?.nama} — {rv.kos?.kota}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReview(rv.id)}
                  disabled={actionLoading === `review-${rv.id}`}
                  title="Hapus ulasan"
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={reviewPage} totalPages={reviewTotalPages} onPrev={() => setReviewPage(p => p - 1)} onNext={() => setReviewPage(p => p + 1)} />
    </div>
  );

  // -----------------------------------------------
  // Tab definitions
  // -----------------------------------------------
  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: BarChart2 },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'listings', label: 'Verifikasi Listing', icon: Building },
    { id: 'reports', label: 'Laporan', icon: AlertTriangle },
    { id: 'reviews', label: 'Moderasi Ulasan', icon: Star },
  ];

  if (!isAdmin) return null;

  // -----------------------------------------------
  // Main Render
  // -----------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-fade-in
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Kelola pengguna, verifikasi listing, dan moderasi konten platform KosFinder
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6 overflow-x-auto">
          <nav className="flex gap-1 min-w-max">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-purple-600 text-purple-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'listings' && renderListings()}
          {activeTab === 'reports' && renderReports()}
          {activeTab === 'reviews' && renderReviews()}
        </div>
      </div>
    </div>
  );
}
