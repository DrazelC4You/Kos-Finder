import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Guard anti-drift untuk cabang Prisma di db.js getAllKos.
 *
 * Filter `campus`, `landmark`, `facilities`, dan `rules` dulu hanya ada di
 * MemoryDataStore — cabang Prisma membangun `where` tanpa semuanya, sehingga
 * begitu PostgreSQL aktif halaman pencarian berhenti menyaring tanpa error.
 * Test ini menjalankan db.js dalam mode Prisma (probe koneksi di-mock) dan
 * menuntut dua hal:
 *   1. filter yang bisa diucapkan Prisma benar-benar masuk ke `where`, dan
 *   2. filter yang dicocokkan di JS menghasilkan halaman yang SAMA dengan
 *      jalur memory pada input yang sama.
 */
process.env.NODE_ENV = 'test';

const prisma = (await import('../src/services/prisma.js')).default;
const { db, memoryStore } = await import('../src/services/db.js');
const { createPatcher } = await import('./patchPrisma.js');

const { patch, restore } = createPatcher();

// isPostgresAvailable di-cache pada pemanggilan pertama, jadi probe harus
// sudah di-mock sebelum SATU juga pemanggilan db.* terjadi di file ini.
mock.method(prisma, '$queryRaw', async () => [{ ok: 1 }]);

afterEach(() => {
  restore();
  mock.reset();
});

const idsOf = (rows) => rows.map(k => k.id);

test('filter pencarian masuk ke where Prisma', async () => {
  let captured = null;
  patch(prisma.kos, 'findMany', async (args) => { captured = args; return []; });
  patch(prisma.kos, 'count', async () => 0);

  await db.getAllKos({
    status: 'ACTIVE',
    ownerId: 'owner-1',
    type: 'putra',
    kota: 'Yogyakarta',
    search: 'gadjah',
    campus: 'ugm',
    minPrice: 500000,
    maxPrice: 2000000,
    minRating: 4,
    availableOnly: true,
    sort: 'price-asc',
    page: 2,
    limit: 5
  });

  assert.ok(captured, 'prisma.kos.findMany tidak terpanggil');
  const where = captured.where;
  assert.equal(where.status, 'ACTIVE');
  assert.equal(where.ownerId, 'owner-1');
  assert.equal(where.type, 'PUTRA');
  assert.equal(where.kota.contains, 'Yogyakarta');
  assert.deepEqual(
    where.OR.map(o => Object.keys(o)[0]).sort(),
    ['alamat', 'deskripsi', 'kota', 'nama'],
    'search harus mencakup deskripsi, sama seperti jalur memory'
  );
  assert.deepEqual(where.hargaBulanan, { gte: 500000, lte: 2000000 });
  assert.deepEqual(where.rating, { gte: 4 });
  assert.deepEqual(where.kamarTersedia, { gt: 0 });
  assert.deepEqual(captured.orderBy, { hargaBulanan: 'asc' });
  assert.equal(captured.skip, 5, 'page 2 dengan limit 5 harus skip 5');
  assert.equal(captured.take, 5);
});

test('kata kunci kampus diterjemahkan menjadi kondisi OR di SQL', async () => {
  let captured = null;
  patch(prisma.kos, 'findMany', async (args) => { captured = args; return []; });
  patch(prisma.kos, 'count', async () => 0);

  await db.getAllKos({ status: 'ACTIVE', campus: 'ugm' });

  const campusGroup = campusOr(captured.where);
  const values = campusGroup.map(c => Object.values(c)[0].contains);
  for (const kw of ['ugm', 'gadjah mada', 'kaliurang', 'bulaksumur']) {
    assert.ok(values.includes(kw), `kata kunci "${kw}" tidak sampai ke SQL`);
  }
  // Kelompok kampus tidak boleh menimpa where.OR milik search: keduanya harus
  // ada bersamaan, kalau tidak salah satu filter berhenti menyaring.
  assert.ok(Array.isArray(captured.where.AND), 'campus harus masuk AND, bukan OR');
});

function campusOr(where) {
  assert.ok(Array.isArray(where.AND) && Array.isArray(where.AND[0].OR), 'AND[0].OR tidak ada');
  return where.AND[0].OR;
}

for (const options of [
  { label: 'facilities', opts: { status: 'ACTIVE', facilities: ['AC'], limit: 5 } },
  { label: 'rules 24jam', opts: { status: 'ACTIVE', rules: ['24jam'], limit: 5 } },
  { label: 'facilities + rules', opts: { status: 'ACTIVE', facilities: ['WiFi'], rules: ['pasutri'], limit: 5 } },
  { label: 'facilities + halaman 2', opts: { status: 'ACTIVE', facilities: ['AC'], limit: 2, page: 2 } }
]) {
  test(`cabang Prisma menyamai jalur memory untuk filter ${options.label}`, async () => {
    const expected = await memoryStore.getAllKos(options.opts);
    assert.ok(expected.data.length > 0, `fixture seed harus menghasilkan >0 untuk ${options.label}`);

    // Postgres mengembalikan seluruh kandidat; penyaringan fasilitas/aturan
    // terjadi di JS sebelum pagination.
    const all = await memoryStore.getAllKos({ status: 'ACTIVE', limit: 10000 });
    let args = null;
    patch(prisma.kos, 'findMany', async (a) => { args = a; return all.data; });

    const actual = await db.getAllKos(options.opts);

    assert.equal(args.take, undefined, 'dengan filter JS, take tidak boleh dikirim ke SQL');
    assert.deepEqual(idsOf(actual.data), idsOf(expected.data), 'isi halaman berbeda dengan jalur memory');
    assert.equal(actual.pagination.total, expected.pagination.total);
    assert.equal(actual.pagination.totalPages, expected.pagination.totalPages);
  });
}
