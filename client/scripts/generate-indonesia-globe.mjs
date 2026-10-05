/**
 * Generator aset: peta Indonesia dalam proyeksi orthographic (bola dunia,
 * "dilihat dari luar angkasa") untuk artwork halaman auth.
 *
 * Sumber geometri: paket dotted-map (johan/world.geo.json, turunan Natural
 * Earth) — sama seperti generator titik datar, tapi dengan projection
 * orthographic + center. Region dieksplisitkan supaya dot Indonesia dan dot
 * negara tetangga berada pada ruang koordinat yang identik.
 *
 * Output: src/data/indonesiaGlobe.js
 *   - GLOBE_VIEW        : ukuran viewBox (unit grid dotted-map)
 *   - GLOBE_LIMB        : lingkaran kaki bola (pusat + radius) untuk tepi bola
 *   - GLOBE_GRATICULE   : titik jaringan lintang/bujur (isi "samudra" kosong)
 *   - GLOBE_DOTS_IDN    : satu path SVG berisi titik wilayah Indonesia
 *   - GLOBE_DOTS_REGION : satu path SVG titik negara tetangga (konteks bola)
 *   - GLOBE_PINS        : koordinat 12 kota pada bola yang sama
 *
 * Catatan: addPin() men-snap pin ke titik grid terdekat (±0.5 unit) dan pin di
 * sisi belakang bola dibuang otomatis — cukup akurat untuk dekorasi.
 *
 * Jalankan ulang: node scripts/generate-indonesia-globe.mjs
 */
import DottedMap from 'dotted-map';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.resolve(__dirname, '../src/data/indonesiaGlobe.js');

const CENTER = { lat: -2.5, lng: 118 };
// Crop miring lebar: tetap melengkung seperti dilihat dari orbit (baris dot
// menggembung di tengah) tapi rasionya 1.53:1 — bidang peta, bukan bola.
const REGION = {
  lat: { min: -22, max: 18 },
  lng: { min: 86, max: 150 }
};
const GRID_ROWS = 96;

// SGP/Brunei kecil: BRN ada di dataset, SGP tidak — kode yang tidak ada bikin
// getMap melempar "Cannot read properties of undefined".
const NEIGHBOURS = ['MYS', 'BRN', 'PHL', 'TLS', 'PNG', 'AUS', 'VNM', 'THA'];

const CITIES = [
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
  { name: 'Jayapura', lat: -2.5916, lng: 140.669 }
];

const base = {
  region: REGION,
  grid: 'diagonal',
  height: GRID_ROWS,
  projection: { name: 'orthographic', center: CENTER }
};

// Satu node path untuk seluruh titik: tiap dot = segmen 0.01 unit dengan
// stroke-linecap round (jauh lebih ringan daripada ribuan <circle>).
const toPath = (points) =>
  points.map((p) => `M${p.x.toFixed(2)} ${p.y.toFixed(2)}h0.01`).join('');

console.time('generate');
const idnMap = new DottedMap({ ...base, countries: ['IDN'] });
const nbMap = new DottedMap({ ...base, countries: NEIGHBOURS });
console.timeEnd('generate');

const idnDots = idnMap.getPoints();
const nbDots = nbMap.getPoints();
console.log(
  `dot IDN ${idnDots.length} | tetangga ${nbDots.length} | view ${idnMap.width}x${idnMap.height} vs ${nbMap.width}x${nbMap.height}`
);

let view = { width: idnMap.width, height: idnMap.height };
let dotsIdn;
let dotsRegion;
if (idnMap.width === nbMap.width && idnMap.height === nbMap.height) {
  dotsIdn = toPath(idnDots);
  dotsRegion = toPath(nbDots);
} else {
  console.warn('fit region tidak identik — fallback satu path gabungan');
  const all = new DottedMap({ ...base, countries: ['IDN', ...NEIGHBOURS] });
  dotsIdn = toPath(all.getPoints());
  dotsRegion = '';
  view = { width: all.width, height: all.height };
}

// Pin kota dihitung pada bola yang sama (dipakai komponen untuk marker + arcs).
for (const c of CITIES) {
  idnMap.addPin({
    lat: c.lat,
    lng: c.lng,
    svgOptions: { radius: 1.2, color: '#059669' },
    data: { name: c.name }
  });
}
const pins = idnMap
  .getPoints()
  .filter((p) => p.data && p.data.name)
  .map((p) => ({ name: p.data.name, x: +p.x.toFixed(2), y: +p.y.toFixed(2) }));
console.log(`pin kota: ${pins.length}/${CITIES.length}`);
if (pins.length < CITIES.length) {
  console.warn('ada kota yang jatuh di luar region / sisi belakang bola dan dibuang');
}

// Graticule: paralel & meridian tiap 10° dalam crop, dicuplik tiap 4°. Titik
// yang jarak lingkaran besarnya > 88° dari pusat dibuang — orthographic tidak
// boleh menggambar sisi belakang bola.
const rad = (d) => (d * Math.PI) / 180;
const centralAngle = (lat, lng) => {
  const phi0 = rad(CENTER.lat);
  const phi = rad(lat);
  const dLng = rad(lng - CENTER.lng);
  return Math.acos(
    Math.min(1, Math.max(-1, Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dLng)))
  );
};
const graticule = [];
for (let lat = Math.ceil(REGION.lat.min / 10) * 10; lat <= REGION.lat.max; lat += 10) {
  for (let lng = REGION.lng.min; lng <= REGION.lng.max; lng += 4) {
    if (centralAngle(lat, lng) < rad(88)) graticule.push([lat, lng]);
  }
}
for (let lng = Math.ceil(REGION.lng.min / 10) * 10; lng <= REGION.lng.max; lng += 10) {
  for (let lat = REGION.lat.min; lat <= REGION.lat.max; lat += 4) {
    if (centralAngle(lat, lng) < rad(88)) graticule.push([lat, lng]);
  }
}
for (const [lat, lng] of graticule) {
  idnMap.addPin({ lat, lng, svgOptions: { radius: 0.6, color: '#0f766e' }, data: { grat: 1 } });
}
const gratDots = idnMap.getPoints().filter((p) => p.data && p.data.grat);
const dotsGraticule = toPath(gratDots);
console.log(`graticule: ${gratDots.length} titik`);

const banner = `/**
 * GLOBE INDONESIA — PROYEKSI ORTHOGRAPHIC. DI-GENERATE, jangan edit manual.
 * Sumber: dotted-map (johan/world.geo.json, turunan Natural Earth), projection
 * orthographic center lat ${CENTER.lat} lng ${CENTER.lng}, region
 * lat ${REGION.lat.min}..${REGION.lat.max} / lng ${REGION.lng.min}..${REGION.lng.max}
 * (dieksplisitkan supaya dot Indonesia dan tetangga memakai ruang koordinat sama).
 * Pin = addPin(): ter-snap ke titik grid terdekat, sisi belakang bola dibuang.
 * Generator: scripts/generate-indonesia-globe.mjs
 */`;

const out = `${banner}
export const GLOBE_VIEW = { width: ${view.width}, height: ${view.height} };
export const GLOBE_GRATICULE = "${dotsGraticule}";
export const GLOBE_DOTS_IDN = "${dotsIdn}";
export const GLOBE_DOTS_REGION = "${dotsRegion}";
export const GLOBE_PINS = ${JSON.stringify(pins)};
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, out);
console.log('tertulis ke', OUT_FILE, `(${(out.length / 1024).toFixed(1)} KB)`);
