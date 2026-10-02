/**
 * Generator aset: data peta Indonesia bertitik untuk komponen IndonesiaMap.
 *
 * Sumber geometri: dotted-map (batas negara Indonesia dari johan/world.geo.json,
 * turunan Natural Earth) — hanya IDN, region difokuskan pada kepulauan Indonesia.
 *
 * Output: src/data/indonesiaMap.js
 *   - DOT_ROW_PATHS : satu path SVG per baris grid heksagonal (optimasi DOM,
 *                    titik dirender lewat stroke-dasharray "0 pitch" + linecap round)
 *   - projectLatLng : proyeksi lat/lng -> ruang SVG (Mercator, sinkron dengan grid)
 *
 * Jalankan ulang: node scripts/generate-indonesia-map.mjs
 */
import DottedMap from 'dotted-map';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../src/data/indonesiaMap.js');

// ── Spesifikasi proyeksi (WAJIB sinkron dengan rumus di bawah) ───────────────
// Bounding box kepulauan Indonesia + margin.
const BBOX = { latMin: -11.75, latMax: 7.25, lngMin: 93.5, lngMax: 141.5 };
const GRID_ROWS = 84; // jumlah baris grid heksagonal (pitch ~0.23°)

const rad = (deg) => (deg * Math.PI) / 180;
const mercY = (lat) => Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2));

const X_RANGE = rad(BBOX.lngMax) - rad(BBOX.lngMin);
const Y_RANGE = mercY(BBOX.latMax) - mercY(BBOX.latMin);

const VIEW_W = 1000;
const VIEW_H = VIEW_W * (Y_RANGE / X_RANGE);

// Proyeksi lat/lng -> koordinat SVG (idak bergantung dotted-map).
function projectLatLng(lat, lng) {
  const u = (rad(lng) - rad(BBOX.lngMin)) / X_RANGE;
  const v = (mercY(BBOX.latMax) - mercY(lat)) / Y_RANGE;
  return { x: +(u * VIEW_W).toFixed(2), y: +(v * VIEW_H).toFixed(2) };
}

// ── Generate grid dari dotted-map ────────────────────────────────────────────
console.time('generate');
const map = new DottedMap({
  countries: ['IDN'],
  region: {
    lat: { min: BBOX.latMin, max: BBOX.latMax },
    lng: { min: BBOX.lngMin, max: BBOX.lngMax },
  },
  grid: 'diagonal',
  height: GRID_ROWS,
});
console.timeEnd('generate');

const points = map.getPoints();
const gridW = map.width;
const pitch = VIEW_W / gridW;
console.log(`titik: ${points.length} | grid ${gridW}x${GRID_ROWS} | pitch ${pitch.toFixed(2)} svg-unit`);

// ── Kelompokkan per baris (localy identik karena dari loop yang sama) ────────
const rows = new Map();
for (const p of points) {
  if (!rows.has(p.y)) rows.set(p.y, []);
  rows.get(p.y).push(p.x); // localx berupa int atau int+0.5 (offset diagonal)
}

// Satu path per baris: "M x y H x2 M x3 y H x4 ..." — konsekutif = run satu pulau.
const rowPaths = [];
for (const [localy, xs] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
  xs.sort((a, b) => a - b);
  const y = +((localy / GRID_ROWS) * VIEW_H).toFixed(2);
  let d = '';
  let runStart = xs[0];
  let prev = xs[0];
  for (let i = 1; i <= xs.length; i++) {
    const cur = xs[i];
    if (cur === undefined || cur - prev > 1.01) {
      const x1 = +((runStart / gridW) * VIEW_W).toFixed(2);
      const x2 = +((prev / gridW) * VIEW_W).toFixed(2);
      d += `M${x1} ${y}H${x2}`;
      runStart = cur;
    }
    if (cur !== undefined) prev = cur;
  }
  rowPaths.push(d);
}
console.log('baris:', rows.size, '-> path:', rowPaths.length);

// ── Verifikasi proyeksi: pin Jakarta harus dekat titik grid yang sama ───────
const jakarta = projectLatLng(-6.2088, 106.8456);
const jakartaGrid = { x: ((jakarta.x / VIEW_W) * gridW).toFixed(1), y: ((jakarta.y / VIEW_H) * GRID_ROWS).toFixed(1) };
const nearPin = points.find(
  (p) => Math.abs(p.x - jakartaGrid.x) < 1.5 && Math.abs(p.y - jakartaGrid.y) < 1.5
);
console.log('verifikasi jakarta:', JSON.stringify(jakarta), 'grid:', JSON.stringify(jakartaGrid), '-> titik terdekat ada:', !!nearPin);

// ── Tulis modul keluaran ────────────────────────────────────────────────────
const banner = `/**
 * DATA PETA INDONESIA BERTITIK — DI-GENERATE, jangan edit manual.
 * Sumber geometri: dotted-map (johan/world.geo.json / Natural Earth), negara IDN.
 * BBox: lat ${BBOX.latMin}..${BBOX.latMax}, lng ${BBOX.lngMin}..${BBOX.lngMax}; grid diagonal ${GRID_ROWS} baris.
 * Render: tiap path baris diberi stroke-dasharray "0 ${pitch.toFixed(3)}" + linecap round.
 * Generator: scripts/generate-indonesia-map.mjs
 */`;

const out = `${banner}
export const MAP_VIEW = { width: ${VIEW_W.toFixed(2)}, height: ${VIEW_H.toFixed(2)} };
export const MAP_PITCH = ${pitch.toFixed(4)};
export const DOT_ROW_PATHS = ${JSON.stringify(rowPaths)};

export function projectLatLng(lat, lng) {
  const rad = (d) => (d * Math.PI) / 180;
  const mercY = (l) => Math.log(Math.tan(Math.PI / 4 + rad(l) / 2));
  const X_RANGE = ${X_RANGE};
  const Y_RANGE = ${Y_RANGE};
  const u = (rad(lng) - rad(${BBOX.lngMin})) / X_RANGE;
  const v = (mercY(${BBOX.latMax}) - mercY(lat)) / Y_RANGE;
  return { x: +(u * ${VIEW_W}).toFixed(2), y: +(v * ${VIEW_H.toFixed(2)}).toFixed(2) };
}
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, out);
console.log('tertulis ke', OUT_FILE, `(${(out.length / 1024).toFixed(1)} KB)`);
