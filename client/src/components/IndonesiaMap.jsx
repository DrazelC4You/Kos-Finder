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
 *  - markerOpacity: opasitas marker kota (default 0.92; turunkan untuk pemakaian sebagai latar)
 *  - animationDuration: detik animasi draw-in koneksi
 *  - loop: ulangi animasi koneksi
 *  - className: kelas sizing/posisi untuk <svg>
 *
 * Treatment:
 *  - Desktop: Peta Indonesia penuh di belakang teks hero (1020px), 8 kota, koneksi lengkap.
 *  - Mobile (< 768px): Versi miniatur dari komposisi desktop yang SAMA — peta tetap duduk
 *    di belakang teks hero (headline/deskripsi). Dot beropasitas halus (0.13–0.18), quiet zone
 *    radial di balik teks terpadat, koneksi & marker lembut agar teks tetap 100% terbaca.
 */
import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  DOT_ROW_PATHS,
  JAVA_ROW_PATHS,
  OTHER_ROW_PATHS,
  MAP_PITCH,
  MAP_VIEW,
  projectLatLng,
} from '../data/indonesiaMap.js';

const DOT_COLOR = '#0f766e';      // teal-700 — kepulauan luar, halus
const JAVA_DOT_COLOR = '#047857'; // emerald-700 — Jawa, sedikit lebih tegas

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

// Kurva kuadratik melengkung ke utara (seperti arc penerbangan)
function arcPath(a, b, curvature = 0.25) {
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
  markerOpacity = 0.92,
  animationDuration = 3,
  loop = true,
  className = '',
}) {
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();

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
      byName.set(loc.name, { ...loc, ...projectLatLng(loc.lat, loc.lng) });
    });
    return byName;
  }, [activeLocations]);

  // ViewBox selalu proporsional penuh nusantara (1000 x 397.97) tanpa crop agresif
  const vb = { x: 0, y: 0, w: MAP_VIEW.width, h: MAP_VIEW.height };

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
        {!isMobile && (
          <ellipse cx="355" cy="305" rx="125" ry="32" fill="url(#java-aura)" />
        )}

        {/* Kepulauan luar: Sumatra, Kalimantan, Sulawesi, Maluku, Papua */}
        {(OTHER_ROW_PATHS || DOT_ROW_PATHS).map((d, i) => (
          <path
            key={`other-${i}`}
            d={d}
            fill="none"
            stroke={DOT_COLOR}
            strokeWidth={isMobile ? 3.4 : 2.7}
            strokeLinecap="round"
            strokeDasharray={`0 ${MAP_PITCH}`}
            opacity={isMobile ? 0.15 : 0.28}
          />
        ))}

        {/* Pulau Jawa + Bali: aksen hijau KosFinder, sedikit lebih tegas tapi tetap menyatu */}
        {(JAVA_ROW_PATHS || []).map((d, i) => (
          <path
            key={`java-${i}`}
            d={d}
            fill="none"
            stroke={JAVA_DOT_COLOR}
            strokeWidth={isMobile ? 3.8 : 2.9}
            strokeLinecap="round"
            strokeDasharray={`0 ${MAP_PITCH}`}
            opacity={isMobile ? 0.22 : 0.40}
          />
        ))}

        {/* Desktop: topeng radial fade di belakang headline */}
        {!isMobile && (
          <rect
            x="0" y="0"
            width={MAP_VIEW.width} height={MAP_VIEW.height}
            fill="url(#hero-center-mask)"
            opacity="0.9"
          />
        )}

        {/* Mobile: quiet zone radial lembut di area tengah teks — luar tetap jelas */}
        {isMobile && (
          <rect
            x="0" y="0"
            width={MAP_VIEW.width} height={MAP_VIEW.height}
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
            strokeWidth={isMobile ? 0.8 : 1.3}
            opacity={isMobile ? 0.12 : 0.25}
          />
          <motion.path
            d={arc.d}
            fill="none"
            stroke={lineColor}
            strokeWidth={isMobile ? 1.1 : 1.7}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={
              animating
                ? { pathLength: [0, 1, 1], opacity: isMobile ? [0, 0.40, 0] : [0, 0.85, 0] }
                : { pathLength: 1, opacity: isMobile ? 0.30 : 0.7 }
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
          <g opacity={isMobile ? 0.38 : markerOpacity}>
            <circle
              className="kos-map-pulse"
              cx={p.x} cy={p.y}
              r={isMobile ? 3.4 : 5.5}
              fill="none"
              stroke={lineColor}
              strokeWidth={isMobile ? 1.0 : 1.5}
              style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            />
            <circle cx={p.x} cy={p.y} r={isMobile ? 2.5 : 4.2} fill={lineColor} opacity={0.92} />
            <circle cx={p.x} cy={p.y} r={isMobile ? 1.0 : 1.7} fill="#ffffff" />
          </g>
          {showLabels && !isMobile && (
            <text
              x={p.x}
              y={p.y + (p.labelSide === 'above' ? -12 : (p.labelDy ?? 22))}
              textAnchor="middle"
              fontSize={11.5}
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
