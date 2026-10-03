import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Guard anti-drift: katalog kampus di client harus tetap sinkron dengan kata
 * kunci pencarian di server. Id-lah yang menentukan hasil filter — kalau id
 * client tidak dikenal server, filter `campus=` mengembalikan nol hasil tanpa
 * error apa pun (db.js jatuh ke fallback [target]).
 *
 * client/src/data/campuses.js dibaca langsung sebagai ESM polos; modul itu
 * sengaja tidak boleh punya import.
 */
process.env.NODE_ENV = 'test';

const { CAMPUS_PRESETS, POPULAR_CITIES } = await import('../../client/src/data/campuses.js');
const { CAMPUS_KEYWORDS, CAMPUS_IDS } = await import('../src/services/campusKeywords.js');
const { db } = await import('../src/services/db.js');

// Id server yang memang tidak punya kartu kampus di client. Menambah id baru
// ke CAMPUS_KEYWORDS tanpa preset client akan menggagalkan test ini sampai
// keputusannya ditulis di sini secara sadar.
const SERVER_ONLY = ['jakarta', 'stasiun'];

test('setiap id kampus client punya kata kunci di server', () => {
  const missing = CAMPUS_PRESETS.filter(c => !CAMPUS_KEYWORDS[c.id]);
  assert.deepEqual(missing.map(c => c.id), [], 'id kampus client tanpa kata kunci server');
});

test('setiap kota kampus client ada di daftar kota pencarian', () => {
  const cityIds = new Set(POPULAR_CITIES.map(c => c.id));
  const missing = CAMPUS_PRESETS.filter(c => !cityIds.has(c.city));
  assert.deepEqual(missing.map(c => `${c.id}:${c.city}`), [], 'kota kampus tidak bisa dipilih di filter');
});

test('id server tanpa preset client harus terdaftar eksplisit', () => {
  const clientIds = new Set(CAMPUS_PRESETS.map(c => c.id));
  const serverOnly = CAMPUS_IDS.filter(id => !clientIds.has(id));
  assert.deepEqual(serverOnly, SERVER_ONLY);
});

test('setiap landmark server menghasilkan hitungan bertipe angka', async () => {
  const landmarks = await db.getCampusLandmarks();
  assert.ok(landmarks.length >= CAMPUS_IDS.length, 'jumlah landmark kurang dari jumlah id kata kunci');
  for (const lm of landmarks) {
    assert.ok(Array.isArray(lm.keywords) && lm.keywords.length > 0, `landmark ${lm.id} tanpa kata kunci`);
    assert.equal(typeof lm.totalKos, 'number', `landmark ${lm.id} totalKos bukan angka`);
  }
});
