/**
 * IndonesiaMap — dekoratif: peta Indonesia bertitik + marker kota + koneksi melengkung animasi.
 * Data grid statis dari src/data/indonesiaMap.js (generated, jangan edit manual).
 * Komponen murni dekoratif: aria-hidden + non-interaktif; posisikan sebagai layer
 * absolute/pointer-events-none di parent.
 *
 * Props:
 *  - locations: [{ name, lat, lng, label?, labelSide?: 'above'|'below', labelDy? }]
 *  - connections: [{ from, to, curvature? }]   (from/to = name lokasi)
 *  - lineColor: warna marker & koneksi (default emerald-500)
 *  - showLabels: tampilkan nama kota (desktop saja; mobile otomatis disembunyikan)
 *  - responsiveDots: true (default) = dot, marker & ketebalan menyusut mengikuti
 *    lebar VIEWPORT — untuk pemakaian full-bleed seperti hero beranda. false =
 *    ukuran natural terhadap viewBox, untuk pemakaian di kolom sempit (latar
 *    auth) yang kalau ikut viewport jadi terlalu tipis.
 *  - markerOpacity: opasitas marker kota (default 0.92; turunkan untuk pemakaian sebagai latar)
 *  - animationDuration: detik animasi draw-in koneksi
 *  - loop: ulangi animasi koneksi
 *  - className: kelas sizing/posisi untuk <svg>
 *
 * Treatment — dua ambang berbeda, jangan disamakan:
 *  - isQuiet (< 1024px): bobot VISUAL diturunkan (dot 0.15/0.22, arc & marker lembut,
 *    topeng radial terpusat di belakang headline, tanpa java-aura). Alasannya: di
 *    768-1023px peta sudah selebar viewport sementara headline masih berada di atas
 *    pita Jawa. Terukur di belakang blok headline (piksel tergelap, teks dibuang):
 *    opasitas desktop 6,56:1 vs opasitas quiet 8,05:1 — ponsel sendiri ~11:1.
 *  - isMobile (< 768px): ISI yang disederhanakan — 4 kota, 3 koneksi, ketebalan &
 *    radius dot memakai nilai tetap, label kota mati.
 *  - >= 1024px: komposisi penuh (8 kota, semua koneksi, aura Jawa, topeng cx 36%),
 *    dengan dotScale menyusut mengikuti lebar agar kerapatan visual tetap sama.
 */
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  DOT_ROW_PATHS,
  MAP_PITCH,
  MAP_VIEW,
  projectLatLng,
} from '../data/indonesiaMap.js';

const DOT_COLOR = '#0f766e';      // teal-700 — kepulauan luar, halus
const JAVA_DOT_COLOR = '#047857'; // emerald-700 — Jawa, sedikit lebih tegas

// Grid hasil generate melar vertikal ±1.7x terhadap Indonesia sebenarnya:
// viewBox 1000x397.97 (2.51:1) padahal geografi hanya membentang 324 unit
// (3.09:1), aslinya ~5:1. Melarnya bikin band Jawa duduk di 69-84% tinggi peta,
// sehingga setiap kali peta dibuat full-bleed ia selalu jatuh ke belakang
// search card. Dipadatkan pada level koordinat path — bukan lewat
// transform="scale(1, k)" — karena scale non-uniform memipihkan ujung round-cap
// menjadi elips dan dot berubah jadi garis pendek.
const Y_SQUASH = 0.62;
const VIEW = { w: MAP_VIEW.width, h: +(MAP_VIEW.height * Y_SQUASH).toFixed(2) };

// Data path hanya berisi pasangan "M x y H x2"; perintah H memakai y aktif,
// jadi cukup memetakan ulang angka y pada setiap M.
const squashRows = (rows) => (rows || []).map((d) =>
  d.replace(/M(-?[\d.]+) (-?[\d.]+)/g, (_, x, y) => `M${x} ${(+y * Y_SQUASH).toFixed(2)}`)
);

// Segmen yang jatuh di kotak Jawa (+ Madura/Bali) digambar dengan warna lebih
// tegas. Pemisahan ini logika visual, jadi dihitung di komponen: file data
// hasil `npm run generate:map` hanya berisi geometri mentah sehingga proses
// regenerasi tidak pernah menimpa kode tulisan tangan.
const splitByJavaBounds = (rows) => {
  const java = [];
  const other = [];
  for (const pathStr of rows) {
    let jRow = '';
    let oRow = '';
    for (const part of pathStr.match(/M[\d.]+ [\d.]+H[\d.]+/g) || []) {
      const m = part.match(/M([\d.]+) ([\d.]+)H([\d.]+)/);
      if (!m) continue;
      const [, x1, y, x2] = m;
      if (+y >= 268 && +y <= 345 && +x1 >= 240 && +x2 <= 470) jRow += part;
      else oRow += part;
    }
    if (jRow) java.push(jRow);
    if (oRow) other.push(oRow);
  }
  return { java, other };
};

const { java: JAVA_ROWS_RAW, other: OTHER_ROWS_RAW } = splitByJavaBounds(DOT_ROW_PATHS);
const JAVA_ROWS = squashRows(JAVA_ROWS_RAW);
const OTHER_ROWS = squashRows(OTHER_ROWS_RAW);

// Tekstur desktop di-tuning pada lebar ~1024px. SVG diskalakan dari viewBox
// 1000 units, jadi di layar lebar dot & marker ikut membesar (1920px = 1.92x).
// Faktor ini menurunkannya lagi supaya ukuran DAN kerapatan dot tetap sama.
const DESKTOP_REF_WIDTH = 1024;
const MIN_DOT_SCALE = 0.35;

function useDotScale() {
  const read = () => {
    if (typeof window === 'undefined') return 1;
    const w = window.innerWidth;
    // Di bawah lg peta tidak full-bleed, jadi tidak perlu dikompensasi.
    if (w < 1024) return 1;
    return Math.max(MIN_DOT_SCALE, Math.min(1, DESKTOP_REF_WIDTH / w));
  };
  const [scale, setScale] = React.useState(read);
  React.useEffect(() => {
    const onResize = () => setScale(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

function useIsMobile() {
  const query = '(max-width: 767px)';
  const [isMobile, setIsMobile] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsMobile(e.matches);
    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

// Bobot visual "quiet" berlaku sampai < lg, bukan hanya di ponsel. Di 768-1023px
// peta sudah selebar viewport sementara headline masih duduk di atas pita Jawa,
// jadi opasitas desktop di sana membuat dot ikut menempati belakang teks.
function useIsQuiet() {
  const query = '(max-width: 1023px)';
  const [isQuiet, setIsQuiet] = React.useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );
  React.useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e) => setIsQuiet(e.matches);
    mql.addEventListener('change', onChange);
    setIsQuiet(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isQuiet;
}

// Kurva kuadratik melengkung ke utara (seperti arc penerbangan). Diekspor agar
// artwork lain (globe orthographic halaman auth) memakai kurva yang sama.
export function arcPath(a, b, curvature = 0.25) {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  let px = -dy / len;
  let py = dx / len;
  if (py > 0) {
    px = -px;
    py = -py;
  }
  const k = curvature * len;
  const cx = +(mx + px * k).toFixed(2);
  const cy = +(my + py * k).toFixed(2);
  return `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
}

export default function IndonesiaMap({
  locations = [],
  connections = [],
  lineColor = '#10b981',
  showLabels = true,
  responsiveDots = true,
  markerOpacity = 0.92,
  animationDuration = 3,
  loop = true,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const isQuiet = useIsQuiet();
  const viewportDotScale = useDotScale();
  const dotScale = responsiveDots ? viewportDotScale : 1;

  // Pada mobile: pilih 4 kota kunci sepanjang Jawa–Bali agar seimbang
  const activeLocations = useMemo(() => {
    if (!isMobile) return locations;
    const mobileKeyCities = new Set(['Jakarta', 'Yogyakarta', 'Surabaya', 'Bali']);
    return locations.filter((loc) => mobileKeyCities.has(loc.name));
  }, [isMobile, locations]);

  const points = useMemo(() => {
    const byName = new Map();
    activeLocations.forEach((loc) => {
      if (!loc || typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return;
      const p = projectLatLng(loc.lat, loc.lng);
      byName.set(loc.name, { ...loc, x: p.x, y: +(p.y * Y_SQUASH).toFixed(2) });
    });
    return byName;
  }, [activeLocations]);

  // ViewBox sudah dipadatkan bersama seluruh geometri (lihat Y_SQUASH).
  const vb = { x: 0, y: 0, w: VIEW.w, h: VIEW.h };

  // Pada mobile: koneksi 3 segmen halus sepanjang Jawa–Bali
  const activeConnections = useMemo(() => {
    if (!isMobile) return connections;
    return [
      { from: 'Jakarta', to: 'Yogyakarta' },
      { from: 'Yogyakarta', to: 'Surabaya' },
      { from: 'Surabaya', to: 'Bali' },
    ];
  }, [isMobile, connections]);

  const arcs = useMemo(() => {
    const resolved = activeConnections
      .map((c) => {
        const a = points.get(c.from);
        const b = points.get(c.to);
        if (!a || !b) return null;
        return { key: `${c.from}->${c.to}`, d: arcPath(a, b, c.curvature ?? 0.25) };
      })
      .filter(Boolean);
    return resolved;
  }, [activeConnections, points]);

  const animating = loop && !reducedMotion;

  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      style={{ aspectRatio: `${vb.w} / ${vb.h}` }}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {/* Desktop: aura Jawa halus */}
        <radialGradient id="java-aura" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#10b981" stopOpacity="0.07" />
          <stop offset="55%"  stopColor="#059669" stopOpacity="0.03" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0" />
        </radialGradient>

        {/* Desktop: topeng radial putih lembut di belakang headline hero */}
        <radialGradient id="hero-center-mask" cx="36%" cy="72%" r="38%" gradientUnits="objectBoundingBox">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Mobile: quiet zone radial lembut tepat di balik area teks terpadat (tengah) */}
        <radialGradient id="mobile-center-mask" cx="50%" cy="58%" r="42%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.36" />
          <stop offset="50%"  stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lapisan dot peta Indonesia — tampak jelas tapi lembut sebagai background atmosphere */}
      <motion.g
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Desktop only: aura Jawa lembut */}
        {!isQuiet && (
          <ellipse cx="355" cy={+(305 * Y_SQUASH).toFixed(2)} rx="125" ry={+(32 * Y_SQUASH).toFixed(2)} fill="url(#java-aura)" />
        )}

        {/* Kepulauan luar: Sumatra, Kalimantan, Sulawesi, Maluku, Papua */}
        {OTHER_ROWS.map((d, i) => (
          <path
            key={`other-${i}`}
            d={d}
            fill="none"
            stroke={DOT_COLOR}
            strokeWidth={isMobile ? 3.4 : 2.7 * dotScale}
            strokeLinecap="round"
            strokeDasharray={`0 ${MAP_PITCH * (isMobile ? 1 : dotScale)}`}
            opacity={isQuiet ? 0.15 : 0.28}
          />
        ))}

        {/* Pulau Jawa + Bali: aksen hijau Singgah, sedikit lebih tegas tapi tetap menyatu */}
        {JAVA_ROWS.map((d, i) => (
          <path
            key={`java-${i}`}
            d={d}
            fill="none"
            stroke={JAVA_DOT_COLOR}
            strokeWidth={isMobile ? 3.8 : 2.9 * dotScale}
            strokeLinecap="round"
            strokeDasharray={`0 ${MAP_PITCH * (isMobile ? 1 : dotScale)}`}
            opacity={isQuiet ? 0.22 : 0.40}
          />
        ))}

        {/* Desktop: topeng radial fade di belakang headline */}
        {!isQuiet && (
          <rect
            x="0" y="0"
            width={VIEW.w} height={VIEW.h}
            fill="url(#hero-center-mask)"
            opacity="0.9"
          />
        )}

        {/* Mobile: quiet zone radial lembut di area tengah teks — luar tetap jelas */}
        {isQuiet && (
          <rect
            x="0" y="0"
            width={VIEW.w} height={VIEW.h}
            fill="url(#mobile-center-mask)"
          />
        )}
      </motion.g>

      {/* Jalur koneksi antar kota:
          - Desktop: jalur penuh 8 kota animasi
          - Mobile: 3 jalur animasi tipis dan halus */}
      {arcs.map((arc, i) => (
        <g key={arc.key}>
          <path
            d={arc.d}
            fill="none"
            stroke={lineColor}
            strokeWidth={isMobile ? 0.8 : 1.3 * dotScale}
            opacity={isQuiet ? 0.12 : 0.25}
          />
          <motion.path
            d={arc.d}
            fill="none"
            stroke={lineColor}
            strokeWidth={isMobile ? 1.1 : 1.7 * dotScale}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              animating
                ? { pathLength: [0, 1, 1], opacity: isQuiet ? [0, 0.40, 0] : [0, 0.85, 0] }
                : { pathLength: 1, opacity: isQuiet ? 0.30 : 0.7 }
            }
            transition={
              animating
                ? {
                    duration: animationDuration + (isMobile ? 1.6 : 1.4),
                    times: [0, 0.55, 1],
                    delay: 0.4 + i * 0.4,
                    repeat: Infinity,
                    repeatDelay: isMobile ? 1.2 : 0.9,
                    ease: 'easeInOut',
                  }
                : { duration: 0.8, ease: 'easeOut' }
            }
          />
        </g>
      ))}

      {/* Marker kota:
          - Desktop: 8 kota lengkap dengan pulse ring dan label
          - Mobile: 4 marker minimalis tanpa label agar tidak mengganggu teks */}
      {[...points.values()].map((p, i) => (
        <g key={p.name}>
          <g opacity={isQuiet ? 0.38 : markerOpacity}>
            <circle
              className="kos-map-pulse"
              cx={p.x} cy={p.y}
              r={isMobile ? 3.4 : 5.5 * dotScale}
              fill="none"
              stroke={lineColor}
              strokeWidth={isMobile ? 1.0 : 1.5 * dotScale}
              style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            />
            <circle cx={p.x} cy={p.y} r={isMobile ? 2.5 : 4.2 * dotScale} fill={lineColor} opacity={0.92} />
            <circle cx={p.x} cy={p.y} r={isMobile ? 1.0 : 1.7 * dotScale} fill="#ffffff" />
          </g>
          {showLabels && !isMobile && (
            <text
              x={p.x}
              y={p.y + (p.labelSide === 'above' ? -12 : (p.labelDy ?? 22)) * Y_SQUASH}
              textAnchor="middle"
              fontSize={11.5 * dotScale}
              fontWeight={600}
              fill="#047857"
              opacity={0.85}
              stroke="#f8fafc"
              strokeWidth={3}
              paintOrder="stroke"
            >
              {p.label || p.name}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
