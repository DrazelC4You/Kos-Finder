/**
 * Kata kunci pencarian kampus/landmark.
 *
 * SATU-SATUNYA sumber id + kata kunci di sisi server. Dipakai oleh filter
 * `campus`/`landmark` (MemoryDataStore.searchKos) dan oleh daftar landmark
 * (`getCampusLandmarks`). Id di sini harus tetap sinkron dengan katalog client
 * di client/src/data/campuses.js — dijaga oleh server/test/campus-catalog.test.js.
 */
export const CAMPUS_KEYWORDS = {
  unsoed: ['unsoed', 'grendeng', 'soeparno', 'karangwangkal', 'kampus', 'hr boenyamin', 'boenyamin', 'purwokerto utara'],
  ugm: ['ugm', 'gadjah mada', 'kaliurang', 'bulaksumur', 'uny', 'sleman', 'yogyakarta'],
  ui: ['ui', 'universitas indonesia', 'margonda', 'kukusan', 'pondok cina', 'depok', 'salemba'],
  itb: ['itb', 'ganesha', 'dago', 'dipatiukur', 'unpad', 'bandung', 'coblong'],
  ub: ['ub', 'brawijaya', 'soekarno hatta', 'suhat', 'lowokwaru', 'malang', 'polinema'],
  unair: ['unair', 'airlangga', 'its', 'dharmawangsa', 'gubeng', 'sukolilo', 'surabaya'],
  undip: ['undip', 'diponegoro', 'tembalang', 'banjarsari', 'pleburan', 'semarang'],
  bali: ['bali', 'denpasar', 'renon', 'udayana', 'unud', 'jimbaran', 'batanghari'],
  jakarta: ['jakarta', 'tebet', 'kuningan', 'sudirman', 'jakarta selatan', 'salemba'],
  ump: ['ump', 'dukuhwaluh', 'raden patah', 'muhammadiyah', 'kembaran'],
  telkom: ['telkom', 'panjaitan', 'd.i. panjaitan', 'berkoh', 'purwokerto selatan'],
  uinsaizu: ['uin', 'saizu', 'saifuddin zuhri', 'karangkobar', 'purwokerto barat'],
  stasiun: ['stasiun', 'kober', 'bantarsoka', 'alun-alun', 'pasar manis']
};

export const CAMPUS_IDS = Object.keys(CAMPUS_KEYWORDS);

export function keywordsForCampus(campus) {
  const target = String(campus).toLowerCase().trim();
  return CAMPUS_KEYWORDS[target] || [target];
}
