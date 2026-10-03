/**
 * Katalog kampus & kota untuk filter pencarian dan kartu rekomendasi.
 *
 * SATU-SATUNYA sumber kebenaran untuk id kampus/kota di sisi client.
 * - `id` kampus dipakai sebagai kunci `campusKeywordMap` di server
 *   (lihat server/src/services/campusKeywords.js). Mengubah/menghapus id
 *   mengubah hasil filter, bukan cuma teks.
 * - `id` kota adalah nilai `kota` yang dikirim ke API; `name` hanya label.
 *
 * JANGAN menambahkan import apa pun ke file ini — server/test membaca modul
 * ini lewat Node polos untuk memastikan id client dan server tetap sinkron.
 */

export const CAMPUS_PRESETS = [
  {
    id: 'ugm',
    name: 'UGM & UNY',
    full: 'Universitas Gadjah Mada & UNY',
    area: 'Bulaksumur',
    city: 'Yogyakarta',
    latitude: -7.7602,
    longitude: 110.3804,
    bg: 'from-amber-900/60 to-amber-950/90 border-amber-500/30 hover:border-amber-400'
  },
  {
    id: 'ui',
    name: 'UI',
    full: 'Universitas Indonesia',
    area: 'Margonda',
    city: 'Depok',
    latitude: -6.3689,
    longitude: 106.8321,
    bg: 'from-yellow-900/60 to-yellow-950/90 border-yellow-500/30 hover:border-yellow-400'
  },
  {
    id: 'itb',
    name: 'ITB & UNPAD',
    full: 'Institut Teknologi Bandung',
    area: 'Dago',
    city: 'Bandung',
    latitude: -6.8789,
    longitude: 107.6189,
    bg: 'from-cyan-900/60 to-cyan-950/90 border-cyan-500/30 hover:border-cyan-400'
  },
  {
    id: 'undip',
    name: 'UNDIP',
    full: 'Universitas Diponegoro',
    area: 'Tembalang',
    city: 'Semarang',
    latitude: -7.0543,
    longitude: 110.4389,
    bg: 'from-indigo-900/60 to-indigo-950/90 border-indigo-500/30 hover:border-indigo-400'
  },
  {
    id: 'ub',
    name: 'UB & UM',
    full: 'Universitas Brawijaya & UM',
    area: 'Lowokwaru',
    city: 'Malang',
    latitude: -7.9482,
    longitude: 112.6179,
    bg: 'from-orange-900/60 to-orange-950/90 border-orange-500/30 hover:border-orange-400'
  },
  {
    id: 'unair',
    name: 'UNAIR & ITS',
    full: 'Universitas Airlangga & ITS',
    area: 'Gubeng',
    city: 'Surabaya',
    latitude: -7.2721,
    longitude: 112.7562,
    bg: 'from-sky-900/60 to-sky-950/90 border-sky-500/30 hover:border-sky-400'
  },
  {
    id: 'bali',
    name: 'Udayana',
    full: 'Universitas Udayana',
    area: 'Renon',
    city: 'Denpasar',
    latitude: -8.6789,
    longitude: 115.2341,
    bg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/30 hover:border-emerald-400'
  },
  {
    id: 'unsoed',
    name: 'UNSOED',
    full: 'Universitas Jenderal Soedirman',
    area: 'Grendeng',
    city: 'Purwokerto',
    latitude: -7.4243,
    longitude: 109.2486,
    bg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/30 hover:border-emerald-400'
  },
  {
    id: 'ump',
    name: 'UMP',
    full: 'Universitas Muhammadiyah Purwokerto',
    area: 'Dukuhwaluh',
    city: 'Purwokerto',
    latitude: -7.4180,
    longitude: 109.2710,
    bg: 'from-blue-900/60 to-blue-950/90 border-blue-500/30 hover:border-blue-400'
  },
  {
    id: 'telkom',
    name: 'Telkom University',
    full: 'Telkom University Purwokerto',
    area: 'Berkoh',
    city: 'Purwokerto',
    latitude: -7.4420,
    longitude: 109.2550,
    bg: 'from-rose-900/60 to-rose-950/90 border-rose-500/30 hover:border-rose-400'
  },
  {
    id: 'uinsaizu',
    name: 'UIN Saizu',
    full: 'UIN Prof. K.H. Saifuddin Zuhri',
    area: 'Karangkobar',
    city: 'Purwokerto',
    latitude: -7.4120,
    longitude: 109.2250,
    bg: 'from-teal-900/60 to-teal-950/90 border-teal-500/30 hover:border-teal-400'
  }
];

// Urutan kota adalah peringkat UX (bukan turunan dari kampus) supaya kota
// tanpa kampus seperti Jakarta Selatan tetap muncul.
export const POPULAR_CITIES = [
  { id: 'Yogyakarta', name: 'Yogyakarta' },
  { id: 'Bandung', name: 'Bandung' },
  { id: 'Surabaya', name: 'Surabaya' },
  { id: 'Jakarta Selatan', name: 'Jakarta Selatan' },
  { id: 'Depok', name: 'Depok' },
  { id: 'Malang', name: 'Malang' },
  { id: 'Semarang', name: 'Semarang' },
  { id: 'Denpasar', name: 'Denpasar / Bali' },
  { id: 'Purwokerto', name: 'Purwokerto' }
];

export const ALL_AREAS = { id: '', name: 'Semua Area', area: 'Seluruh Indonesia', city: '' };
export const ALL_CITIES = { id: '', name: 'Semua Kota (Indonesia)' };

export const CAMPUS_CHIPS = [ALL_AREAS, ...CAMPUS_PRESETS];
export const CITY_CHIPS = [ALL_CITIES, ...POPULAR_CITIES];
