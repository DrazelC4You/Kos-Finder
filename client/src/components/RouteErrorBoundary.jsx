import React from 'react';

/**
 * Rute dipecah per halaman, jadi kegagalan satu chunk (mis. index.html basi
 * memanggil hash yang sudah tidak ada setelah versi baru terbit) akan membuat
 * dynamic import reject. Tanpa boundary ini hasilnya layar putih tanpa pesan.
 */
export default class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h2 className="font-heading font-bold text-lg text-slate-900">Gagal Memuat Halaman</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Versi aplikasi yang tersimpan di perangkat Anda sudah diperbarui. Muat ulang untuk melanjutkan.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          Muat Ulang
        </button>
      </div>
    );
  }
}
