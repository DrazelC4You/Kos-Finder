import React from 'react';
import IndonesiaMap from '../IndonesiaMap.jsx';

// Kota latar auth: 8 kota Jawa (koordinat sama dengan beranda) + 4 kota pulau
// lain supaya pin tersebar merata di seluruh kepulauan.
const AUTH_CITIES = [
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
  { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
  { name: 'Purwokerto', lat: -7.4297, lng: 109.2341 },
  { name: 'Semarang', lat: -6.9932, lng: 110.4203 },
  { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
  { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
  { name: 'Malang', lat: -7.9666, lng: 112.6326 },
  { name: 'Bali', lat: -8.65, lng: 115.217 },
  { name: 'Medan', lat: 3.5952, lng: 98.6722 },
  { name: 'Balikpapan', lat: -1.2379, lng: 116.8529 },
  { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
  { name: 'Jayapura', lat: -2.5916, lng: 140.669 },
];

const AUTH_CONNECTIONS = [
  { from: 'Jakarta', to: 'Bandung' },
  { from: 'Jakarta', to: 'Yogyakarta' },
  { from: 'Yogyakarta', to: 'Surabaya' },
  { from: 'Jakarta', to: 'Purwokerto' },
  { from: 'Surabaya', to: 'Bali' },
  { from: 'Medan', to: 'Jakarta' },
  { from: 'Surabaya', to: 'Balikpapan' },
  { from: 'Makassar', to: 'Jayapura' },
];

/**
 * Seni peta Indonesia bertitik — sama seperti hero beranda, dengan glow emerald
 * lembut di belakangnya. Posisi dan lebar dikontrol lewat className supaya
 * bisa dipakai sebagai artwork kolom kiri (lg+) maupun latar absolut (mobile).
 */
export function AuthMapArt({ className = '' }) {
  return (
    <div className={`relative ${className}`}>
      {/* Pita peta sangat lebar tapi pendek, jadi glow-nya dilebarkan secara
          vertikal terhadap tinggi container supaya terlihat sebagai cahaya. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[300%] w-[64%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/[0.16] blur-3xl"
      />
      <IndonesiaMap
        className="relative h-auto w-full"
        locations={AUTH_CITIES}
        connections={AUTH_CONNECTIONS}
        lineColor="#059669"
        showLabels={false}
        responsiveDots={false}
        markerOpacity={0.7}
        animationDuration={3}
        loop
      />
    </div>
  );
}

/**
 * Latar halaman auth untuk layar kecil: peta tipis di belakang kartu.
 * Pada lg+ artwork peta pindah ke kolom kiri, jadi layer ini dimatikan.
 */
export default function AuthBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 select-none overflow-hidden lg:hidden"
      aria-hidden="true"
    >
      <AuthMapArt className="absolute inset-x-0 top-1/2 -translate-y-[46%]" />
    </div>
  );
}
