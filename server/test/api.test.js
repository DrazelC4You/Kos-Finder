import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

// Set NODE_ENV sebelum app di-import (mematikan morgan & memakai konfigurasi test)
process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');

// ---------------------------------------------------------------
// Kredensial demo (sesuai prisma/seedData.js)
// ---------------------------------------------------------------
const DEMO = {
  admin: { email: 'admin@singgah.test', password: 'Password123!' },
  owner: { email: 'anton@singgah.test', password: 'Password123!' },
  owner2: { email: 'siti@singgah.test', password: 'Password123!' },
  tenant: { email: 'rian@gmail.com', password: 'Password123!' }
};

const tokens = {};
const uniq = Date.now();

const login = async (email, password) => {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  assert.equal(res.status, 200, `login gagal untuk ${email}: ${JSON.stringify(res.body)}`);
  return res.body.data.token;
};

before(async () => {
  tokens.admin = await login(DEMO.admin.email, DEMO.admin.password);
  tokens.owner = await login(DEMO.owner.email, DEMO.owner.password);
  tokens.owner2 = await login(DEMO.owner2.email, DEMO.owner2.password);
  tokens.tenant = await login(DEMO.tenant.email, DEMO.tenant.password);
});

// ---------------------------------------------------------------
// HEALTH & DATABASE STATUS
// ---------------------------------------------------------------
test('GET /api/health mengembalikan status UP', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.status, 'UP');
});

test('GET /api/database/status melaporkan mode penyimpanan aktif', async () => {
  const res = await request(app).get('/api/database/status');
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.data.isConnectedToPostgres, 'boolean');
});

// ---------------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------------
test('POST /api/auth/register membuat akun tenant baru', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Tester Tenant',
    email: `tester.tenant.${uniq}@test.dev`,
    password: 'TestPass123',
    confirmPassword: 'TestPass123',
    role: 'TENANT'
  });
  assert.ok([200, 201].includes(res.status));
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.role, 'TENANT');
  tokens.newTenant = res.body.data.token;
});

test('POST /api/auth/register menolak email duplikat', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Duplikat',
    email: DEMO.tenant.email,
    password: 'TestPass123',
    role: 'TENANT'
  });
  assert.ok([400, 409].includes(res.status), `status tak terduga: ${res.status}`);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/register menolak format email tidak valid', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Email Rusak',
    email: 'bukan-email',
    password: 'TestPass123',
    role: 'TENANT'
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/login menolak password salah', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: DEMO.tenant.email,
    password: 'PasswordSalah!'
  });
  assert.ok([400, 401].includes(res.status));
  assert.equal(res.body.success, false);
});

test('GET /api/auth/me mengembalikan profil dengan token valid', async () => {
  const res = await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${tokens.tenant}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.email, DEMO.tenant.email);
});

test('GET /api/auth/me tanpa token ditolak 401', async () => {
  const res = await request(app).get('/api/auth/me');
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------
// PUBLIC KOS SEARCH & DETAIL
// ---------------------------------------------------------------
test('GET /api/kos mengembalikan daftar dengan metadata pagination', async () => {
  const res = await request(app).get('/api/kos?page=1&limit=6');
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.equal(res.body.data.length, 6);
  assert.equal(res.body.pagination.page, 1);
  assert.equal(res.body.pagination.limit, 6);
  assert.equal(res.body.pagination.total, 12);
  assert.equal(res.body.pagination.totalPages, 2);
});

test('GET /api/kos?page=2 mengembalikan halaman kedua', async () => {
  const res = await request(app).get('/api/kos?page=2&limit=6');
  assert.equal(res.status, 200);
  assert.equal(res.body.pagination.page, 2);
  assert.equal(res.body.data.length, 6);
});

test('GET /api/kos?search= memfilter berdasarkan kata kunci', async () => {
  const res = await request(app).get('/api/kos?search=purwokerto&limit=50');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0, 'harus ada hasil untuk kata kunci purwokerto');
  for (const k of res.body.data) {
    const haystack = `${k.nama} ${k.kota} ${k.alamat} ${k.deskripsi || ''}`.toLowerCase();
    assert.ok(haystack.includes('purwokerto'), `hasil tidak relevan: ${k.nama}`);
  }
});

test('GET /api/kos memfilter rentang harga dan tipe kos', async () => {
  const res = await request(app).get('/api/kos?minPrice=500000&maxPrice=800000&limit=50');
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0);
  for (const k of res.body.data) {
    const harga = Number(k.hargaBulanan);
    assert.ok(harga >= 500000 && harga <= 800000, `harga di luar rentang: ${k.nama} = ${harga}`);
  }

  const resPutri = await request(app).get('/api/kos?type=PUTRI&limit=50');
  assert.equal(resPutri.status, 200);
  assert.ok(resPutri.body.data.length > 0);
  for (const k of resPutri.body.data) {
    assert.equal(k.type, 'PUTRI');
  }
});

test('GET /api/kos/:id mengembalikan detail kos', async () => {
  const res = await request(app).get('/api/kos/kos-01');
  assert.equal(res.status, 200);
  assert.equal(res.body.data.id, 'kos-01');
  assert.ok(res.body.data.nama);
  assert.ok(Array.isArray(res.body.data.foto));
});

test('GET /api/kos/:id untuk ID tidak dikenal mengembalikan 404', async () => {
  const res = await request(app).get('/api/kos/kos-tidak-ada');
  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------
// AUTHORIZATION MATRIX (role enforcement di backend)
// ---------------------------------------------------------------
test('tenant tidak dapat mengakses endpoint owner (403)', async () => {
  const res = await request(app)
    .get('/api/owner/dashboard')
    .set('Authorization', `Bearer ${tokens.tenant}`);
  assert.equal(res.status, 403);
});

test('owner tidak dapat mengakses endpoint tenant (403)', async () => {
  const res = await request(app)
    .get('/api/tenant/dashboard')
    .set('Authorization', `Bearer ${tokens.owner}`);
  assert.equal(res.status, 403);
});

test('tenant & owner tidak dapat mengakses admin panel (403), anonim 401', async () => {
  const asTenant = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${tokens.tenant}`);
  assert.equal(asTenant.status, 403);

  const asOwner = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${tokens.owner}`);
  assert.equal(asOwner.status, 403);

  const anon = await request(app).get('/api/admin/stats');
  assert.equal(anon.status, 401);
});

test('admin dapat mengakses statistik platform', async () => {
  const res = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${tokens.admin}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
});

test('owner tidak dapat mengubah listing milik owner lain', async () => {
  // kos-01 dimiliki anton; siti mencoba mengubah & menghapusnya
  const putRes = await request(app)
    .put('/api/owner/kos/kos-01')
    .set('Authorization', `Bearer ${tokens.owner2}`)
    .send({ nama: 'Percobaan Bajak' });
  assert.ok([403, 404].includes(putRes.status), `status tak terduga: ${putRes.status}`);
  assert.equal(putRes.body.success, false);

  const delRes = await request(app)
    .delete('/api/owner/kos/kos-01')
    .set('Authorization', `Bearer ${tokens.owner2}`);
  assert.ok([403, 404].includes(delRes.status), `status tak terduga: ${delRes.status}`);
  assert.equal(delRes.body.success, false);

  // Pastikan data kos-01 tidak berubah
  const check = await request(app).get('/api/kos/kos-01');
  assert.notEqual(check.body.data.nama, 'Percobaan Bajak');
});

// ---------------------------------------------------------------
// KOS CRUD (OWNER)
// ---------------------------------------------------------------
test('tenant tidak dapat membuat listing kos (403)', async () => {
  const res = await request(app)
    .post('/api/owner/kos')
    .set('Authorization', `Bearer ${tokens.tenant}`)
    .send({ nama: 'Kos Ilegal', alamat: 'Jl. X', kota: 'Purwokerto', hargaBulanan: 500000 });
  assert.equal(res.status, 403);
});

test('owner CRUD listing kos end-to-end', async () => {
  // CREATE
  const createRes = await request(app)
    .post('/api/owner/kos')
    .set('Authorization', `Bearer ${tokens.owner}`)
    .send({
      nama: 'Kos Uji Otomatis',
      alamat: 'Jl. Pengujian No. 42',
      kota: 'Purwokerto',
      hargaBulanan: 650000,
      type: 'CAMPUR',
      totalKamar: 3,
      foto: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      fasilitas: ['WiFi', 'Kasur']
    });
  assert.ok([200, 201].includes(createRes.status), JSON.stringify(createRes.body));
  const newId = createRes.body.data.id;
  assert.ok(newId);

  // CREATE invalid (field wajib kosong) -> 400
  const badRes = await request(app)
    .post('/api/owner/kos')
    .set('Authorization', `Bearer ${tokens.owner}`)
    .send({ nama: 'Tanpa Alamat' });
  assert.equal(badRes.status, 400);

  // READ lewat endpoint publik
  const detailRes = await request(app).get(`/api/kos/${newId}`);
  assert.equal(detailRes.status, 200);
  assert.equal(detailRes.body.data.nama, 'Kos Uji Otomatis');

  // UPDATE
  const updateRes = await request(app)
    .put(`/api/owner/kos/${newId}`)
    .set('Authorization', `Bearer ${tokens.owner}`)
    .send({ nama: 'Kos Uji Otomatis (Revisi)', hargaBulanan: 700000 });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.success, true);

  const afterUpdate = await request(app).get(`/api/kos/${newId}`);
  assert.equal(afterUpdate.body.data.nama, 'Kos Uji Otomatis (Revisi)');

  // DELETE
  const deleteRes = await request(app)
    .delete(`/api/owner/kos/${newId}`)
    .set('Authorization', `Bearer ${tokens.owner}`);
  assert.equal(deleteRes.status, 200);

  const afterDelete = await request(app).get(`/api/kos/${newId}`);
  assert.equal(afterDelete.status, 404);
});

// ---------------------------------------------------------------
// EMAIL VERIFICATION (OWNER ANTI-TROLL GATE)
// ---------------------------------------------------------------
test('owner baru wajib verifikasi email sebelum bisa membuat listing', async () => {
  // 1. Register owner baru -> emailVerified false
  const regRes = await request(app).post('/api/auth/register').send({
    name: 'Owner Belum Verifikasi',
    email: `owner.unverified.${uniq}@test.dev`,
    password: 'TestPass123',
    confirmPassword: 'TestPass123',
    role: 'OWNER'
  });
  assert.ok([200, 201].includes(regRes.status));
  assert.equal(regRes.body.data.user.role, 'OWNER');
  assert.equal(regRes.body.data.user.emailVerified, false);
  const unverifiedToken = regRes.body.data.token;
  const unverifiedId = regRes.body.data.user.id;

  // 2. Belum verifikasi -> buat listing ditolak 403
  const blockedRes = await request(app)
    .post('/api/owner/kos')
    .set('Authorization', `Bearer ${unverifiedToken}`)
    .send({ nama: 'Kos Troll', alamat: 'Jl. Troll', kota: 'Purwokerto', hargaBulanan: 100000 });
  assert.equal(blockedRes.status, 403);
  assert.equal(blockedRes.body.success, false);

  // 3. Token verifikasi palsu -> 400
  const bogusRes = await request(app)
    .post('/api/auth/verify-email')
    .send({ token: 'token-palsu' });
  assert.equal(bogusRes.status, 400);

  // 4. Kirim ulang email verifikasi (endpoint terproteksi) -> 200
  const resendRes = await request(app)
    .post('/api/auth/resend-verification')
    .set('Authorization', `Bearer ${unverifiedToken}`);
  assert.equal(resendRes.status, 200);

  // 5. Simulasikan klik link di email: buat token via db lalu verifikasi -> 200
  const { default: db } = await import('../src/services/db.js');
  const verification = await db.createEmailVerificationToken(unverifiedId);
  assert.ok(verification && verification.token);
  const verifyRes = await request(app)
    .post('/api/auth/verify-email')
    .send({ token: verification.token });
  assert.equal(verifyRes.status, 200, JSON.stringify(verifyRes.body));
  assert.equal(verifyRes.body.data.user.emailVerified, true);

  // 6. Setelah verifikasi -> buat listing berhasil (token JWT lama tetap dipakai)
  const createRes = await request(app)
    .post('/api/owner/kos')
    .set('Authorization', `Bearer ${unverifiedToken}`)
    .send({
      nama: 'Kos Owner Terverifikasi',
      alamat: 'Jl. Sah No. 1',
      kota: 'Purwokerto',
      hargaBulanan: 500000,
      type: 'CAMPUR'
    });
  assert.ok([200, 201].includes(createRes.status), JSON.stringify(createRes.body));

  // Bersihkan listing uji
  await request(app)
    .delete(`/api/owner/kos/${createRes.body.data.id}`)
    .set('Authorization', `Bearer ${unverifiedToken}`);

  // 7. Resend setelah terverifikasi -> 400
  const resendAgain = await request(app)
    .post('/api/auth/resend-verification')
    .set('Authorization', `Bearer ${unverifiedToken}`);
  assert.equal(resendAgain.status, 400);
});

// ---------------------------------------------------------------
// FAVORITES (TENANT)
// ---------------------------------------------------------------
test('tenant dapat menambah, melihat, dan menghapus favorit', async () => {
  const addRes = await request(app)
    .post('/api/tenant/favorites/kos-02')
    .set('Authorization', `Bearer ${tokens.newTenant}`);
  assert.ok([200, 201].includes(addRes.status), JSON.stringify(addRes.body));

  const listRes = await request(app)
    .get('/api/tenant/favorites')
    .set('Authorization', `Bearer ${tokens.newTenant}`);
  assert.equal(listRes.status, 200);
  const favorites = JSON.stringify(listRes.body.data);
  assert.ok(favorites.includes('kos-02'), 'kos-02 harus ada di daftar favorit');

  const delRes = await request(app)
    .delete('/api/tenant/favorites/kos-02')
    .set('Authorization', `Bearer ${tokens.newTenant}`);
  assert.equal(delRes.status, 200);

  const listAfter = await request(app)
    .get('/api/tenant/favorites')
    .set('Authorization', `Bearer ${tokens.newTenant}`);
  assert.ok(!JSON.stringify(listAfter.body.data).includes('kos-02'));
});

test('owner tidak dapat memakai fitur favorit tenant (403)', async () => {
  const res = await request(app)
    .post('/api/tenant/favorites/kos-02')
    .set('Authorization', `Bearer ${tokens.owner}`);
  assert.equal(res.status, 403);
});

// ---------------------------------------------------------------
// BOOKING & DOUBLE-BOOKING GUARD
// ---------------------------------------------------------------
test('booking end-to-end dengan proteksi double-booking', async (t) => {
  // Siapkan dua tenant baru agar bebas dari booking seed milik rian
  const mkTenant = async (label) => {
    const res = await request(app).post('/api/auth/register').send({
      name: label,
      email: `${label.toLowerCase().replace(/\s+/g, '.')}.${uniq}@test.dev`,
      password: 'TestPass123',
      role: 'TENANT'
    });
    assert.ok([200, 201].includes(res.status));
    return res.body.data.token;
  };
  const tenantA = await mkTenant('Penguji A');
  const tenantB = await mkTenant('Penguji B');

  // Ambil kamar AVAILABLE dari kos-03
  const detail = await request(app).get('/api/kos/kos-03');
  assert.equal(detail.status, 200);
  const room = (detail.body.data.rooms || []).find((r) => r.status === 'AVAILABLE');
  assert.ok(room, 'kos-03 harus punya kamar AVAILABLE untuk pengujian');

  const bookingPayload = {
    kosId: 'kos-03',
    roomId: room.id,
    durasiBulan: 1,
    totalHarga: 600000
  };

  // 1. Tenant A membuat booking -> sukses
  const first = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantA}`)
    .send(bookingPayload);
  assert.ok([200, 201].includes(first.status), JSON.stringify(first.body));
  const bookingId = first.body.data.id;
  assert.ok(bookingId);

  // 2. Tenant A mengulang booking pada kos yang sama -> 400 (duplikat aktif)
  const dupSelf = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantA}`)
    .send(bookingPayload);
  assert.equal(dupSelf.status, 400);
  assert.equal(dupSelf.body.success, false);

  // 3. Tenant B membooking kamar yang sama -> 400 (kamar punya pengajuan aktif)
  const dupRoom = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantB}`)
    .send(bookingPayload);
  assert.equal(dupRoom.status, 400);
  assert.equal(dupRoom.body.success, false);

  // 4. Booking tanpa kosId -> 400
  const noKos = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantB}`)
    .send({ durasiBulan: 1 });
  assert.equal(noKos.status, 400);

  // 5. Owner tidak boleh membuat booking sebagai tenant -> 403
  const asOwner = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tokens.owner}`)
    .send(bookingPayload);
  assert.equal(asOwner.status, 403);

  // 6. Tenant A membatalkan booking (masih PENDING) -> sukses
  const cancel = await request(app)
    .put(`/api/tenant/bookings/${bookingId}/cancel`)
    .set('Authorization', `Bearer ${tenantA}`);
  assert.equal(cancel.status, 200, JSON.stringify(cancel.body));

  // 7. Setelah dibatalkan, Tenant B dapat membooking kamar yang sama -> sukses
  const afterCancel = await request(app)
    .post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantB}`)
    .send(bookingPayload);
  assert.ok([200, 201].includes(afterCancel.status), JSON.stringify(afterCancel.body));

  // 8. Booking milik Tenant A yang sudah CANCELLED tidak bisa dibatalkan lagi -> 400
  const recancel = await request(app)
    .put(`/api/tenant/bookings/${bookingId}/cancel`)
    .set('Authorization', `Bearer ${tenantA}`);
  assert.equal(recancel.status, 400);
});
