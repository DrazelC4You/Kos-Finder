import React from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../BrandLogo.jsx';
import AuthBackground from './AuthBackground.jsx';
import AuthGlobeArt from './AuthGlobeArt.jsx';

function BrandLink({ className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 font-heading text-2xl font-extrabold text-slate-900 ${className}`}
    >
      <BrandLogo className="h-12 w-12" />
      <span>
        Kos<span className="text-emerald-600">Finder</span>
      </span>
    </Link>
  );
}

/**
 * Kerangka halaman auth. Layar besar: dua kolom — kiri artwork peta Indonesia
 * utuh + tagline, kanan form. Layar kecil: satu kolom dengan peta tipis di
 * latar. Chrome aplikasi (navbar + footer + bottom bar) disembunyikan lewat
 * isBare di App.jsx.
 */
export default function AuthShell({ children }) {
  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-white">
      <AuthBackground />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center gap-10 px-4 py-12 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14 lg:px-8">
        {/* Kiri: bidang titik orthographic — lebar tapi tetap tinggi, dengan
            bleed sedikit keluar kolom supaya dot-nya terbaca sebagai artwork. */}
        <section className="hidden lg:flex lg:flex-col lg:items-center lg:justify-center">
          <AuthGlobeArt className="-mx-6 w-[calc(100%+3rem)]" />
          <div className="mt-10 max-w-md text-center">
            <p className="font-heading text-xl font-bold text-slate-900">Kos di seluruh Nusantara</p>
            <p className="mt-1 text-sm text-slate-500">
              Dari Medan sampai Jayapura — listing terverifikasi, harga transparan, langsung ke pemiliknya.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <div className="mb-6 flex justify-center lg:justify-start">
            <BrandLink />
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
