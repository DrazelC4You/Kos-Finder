import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { arcPath } from '../IndonesiaMap.jsx';
import {
  GLOBE_VIEW,
  GLOBE_GRATICULE,
  GLOBE_DOTS_IDN,
  GLOBE_DOTS_REGION,
  GLOBE_PINS
} from '../../data/indonesiaGlobe.js';

// Arc antar kota dipilih yang melintasi laut — jarak antar kota Jawa hanya
// beberapa unit, jadi arc di dalamnya jadi gumpalan, bukan garis.
const GLOBE_ARCS = [
  { from: 'Medan', to: 'Jakarta' },
  { from: 'Jakarta', to: 'Balikpapan' },
  { from: 'Surabaya', to: 'Makassar' },
  { from: 'Makassar', to: 'Jayapura' }
];

const BY_NAME = Object.fromEntries(GLOBE_PINS.map((p) => [p.name, p]));

/**
 * Artwork halaman auth: bidang titik Indonesia dalam proyeksi orthographic —
 * barisnya menggembung seperti dilihat dari orbit, tapi tetap bidang lebar
 * (rasio ~1.5:1), bukan bola. Gradien vertikal emerald→terang meniru
 * treatment komponen Globe di 21st.dev.
 */
export default function AuthGlobeArt({ className = '' }) {
  const reducedMotion = useReducedMotion();
  const animating = !reducedMotion;

  const arcs = useMemo(
    () =>
      GLOBE_ARCS.map((a) => {
        const from = BY_NAME[a.from];
        const to = BY_NAME[a.to];
        if (!from || !to) return null;
        return { key: `${a.from}->${a.to}`, d: arcPath(from, to, 0.22) };
      }).filter(Boolean),
    []
  );

  return (
    <div className={`relative ${className}`}>
      {/* Cahaya lembut di belakang bidang peta */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[84%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-emerald-400/[0.16] blur-3xl"
      />

      <svg
        viewBox={`0 0 ${GLOBE_VIEW.width} ${GLOBE_VIEW.height}`}
        className="relative block h-auto w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="globe-tint" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="55%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          {/* Tepi memudar ke segala arah — bidang, bukan lingkaran */}
          <radialGradient id="globe-edge" cx="50%" cy="50%" r="70%">
            <stop offset="58%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.2" />
          </radialGradient>
          <mask id="globe-fade">
            <rect
              x="0"
              y="0"
              width={GLOBE_VIEW.width}
              height={GLOBE_VIEW.height}
              fill="url(#globe-edge)"
            />
          </mask>
        </defs>

        <g mask="url(#globe-fade)">
          <path
            d={GLOBE_GRATICULE}
            fill="none"
            stroke="#0f766e"
            strokeWidth="0.5"
            strokeLinecap="round"
            opacity="0.13"
          />
          {GLOBE_DOTS_REGION && (
            <path
              d={GLOBE_DOTS_REGION}
              fill="none"
              stroke="#0f766e"
              strokeWidth="0.62"
              strokeLinecap="round"
              opacity="0.22"
            />
          )}
          <path
            d={GLOBE_DOTS_IDN}
            fill="none"
            stroke="url(#globe-tint)"
            strokeWidth="0.9"
            strokeLinecap="round"
            opacity="0.62"
          />
        </g>

        {arcs.map((arc, i) => (
          <g key={arc.key}>
            <path d={arc.d} fill="none" stroke="#059669" strokeWidth="0.35" opacity="0.25" />
            <motion.path
              d={arc.d}
              fill="none"
              stroke="#059669"
              strokeWidth="0.5"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                animating
                  ? { pathLength: [0, 1, 1], opacity: [0, 0.85, 0] }
                  : { pathLength: 1, opacity: 0.55 }
              }
              transition={
                animating
                  ? {
                      duration: 4.2 + i * 0.5,
                      times: [0, 0.55, 1],
                      delay: 0.5 + i * 0.4,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: 'easeInOut'
                    }
                  : { duration: 0.8, ease: 'easeOut' }
              }
            />
          </g>
        ))}

        {/* Pin kota: kecil karena pita Jawa hanya selebar beberapa unit viewBox */}
        {GLOBE_PINS.map((p, i) => (
          <g key={p.name}>
            <circle
              className="kos-map-pulse"
              cx={p.x}
              cy={p.y}
              r="1.8"
              fill="none"
              stroke="#059669"
              strokeWidth="0.4"
              style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            />
            <circle cx={p.x} cy={p.y} r="1.1" fill="#059669" opacity="0.95" />
            <circle cx={p.x} cy={p.y} r="0.45" fill="#ffffff" />
          </g>
        ))}
      </svg>
    </div>
  );
}
