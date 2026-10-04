/**
 * Predicate penyaring kos yang dipakai BERSAMA oleh MemoryDataStore dan cabang
 * Prisma di db.js.
 *
 * Alasannya: dulu predicate ini hidup hanya di dalam MemoryDataStore.getAllKos,
 * sehingga cabang Prisma bisa (dan memang) kehilangan filter `campus`,
 * `landmark`, `facilities`, dan `rules` tanpa error apa pun — begitu PostgreSQL
 * aktif, filter-filter itu berhenti menyaring. Dengan satu implementasi untuk
 * kedua jalur, menambah filter cukup dilakukan di satu tempat.
 *
 * `facilities` dan `rules` sengaja dieksekusi di JS, bukan diterjemahkan ke
 * `where` Prisma: `fasilitas String[]` tidak punya operator substring di fluent
 * API Prisma, dan menyamarkannya dengan `has` (exact) akan membuat pencarian
 * "AC" tidak lagi menemukan "AC + WiFi" — gagal diam-diam ke arah sebaliknya.
 */

export function kosSearchText(kos) {
  return `${kos.nama} ${kos.alamat} ${kos.kota} ${kos.deskripsi || ''}`.toLowerCase();
}

export function matchesSearch(kos, query) {
  const q = String(query).toLowerCase().trim();
  return (
    kos.nama.toLowerCase().includes(q) ||
    kos.kota.toLowerCase().includes(q) ||
    kos.alamat.toLowerCase().includes(q) ||
    (kos.deskripsi && kos.deskripsi.toLowerCase().includes(q))
  );
}

export function matchesCampusKeywords(kos, keywords) {
  const text = kosSearchText(kos);
  return keywords.some(kw => text.includes(kw));
}

/** Kos harus punya SEMUA fasilitas yang diminta; pencocokan dua arah supaya
 *  "Kamar mandi dalam" tetap cocok dengan item tersimpan "kamar mandi". */
export function matchesFacilities(kos, facilities) {
  const stored = (kos.fasilitas || []).map(f => String(f).toLowerCase());
  return facilities.every(f => {
    const target = String(f).toLowerCase().trim();
    return stored.some(kFac => kFac.includes(target) || target.includes(kFac));
  });
}

const RULE_ALTERNATIVES = {
  '24jam': ['24 jam', 'bebas jam malam'],
  'akses 24 jam': ['24 jam', 'bebas jam malam'],
  pasutri: ['pasutri', 'suami istri'],
  bebas_asap: ['dilarang merokok', 'bebas rokok'],
  'dilarang merokok': ['dilarang merokok', 'bebas rokok']
};

export function matchesRules(kos, rules) {
  const aturanText = (kos.aturan || '').toLowerCase();
  const facsText = (kos.fasilitas || []).join(' ').toLowerCase();
  const combined = `${aturanText} ${facsText}`;
  return rules.every(r => {
    const query = String(r).toLowerCase().trim();
    const alternatives = RULE_ALTERNATIVES[query];
    if (alternatives) return alternatives.some(alt => combined.includes(alt));
    return combined.includes(query);
  });
}

/** Filter yang tidak bisa diucapkan Prisma dan karena itu harus disaring di JS
 *  setelah baris diambil. Dipakai db.js untuk memutuskan perlu atau tidaknya
 *  mengambil seluruh hasil sebelum di-paginate. */
export function needsJsPostFilter(options) {
  return Boolean(
    (options.facilities && options.facilities.length > 0) ||
    (options.rules && options.rules.length > 0)
  );
}

export function applyJsPostFilters(kos, options) {
  if (options.facilities && options.facilities.length > 0 && !matchesFacilities(kos, options.facilities)) return false;
  if (options.rules && options.rules.length > 0 && !matchesRules(kos, options.rules)) return false;
  return true;
}
