import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');

/**
 * Alur pembayaran dari HTTP, pada jalur yang benar-benar dipakai development
 * (memory store). Test mock di payment-prisma.test.js menjepit bentuk kueri,
 * tapi tidak ada satu pun yang sebelumnya memanggil endpoint /api/payments —
 * padahal itu yang dilihat penyewa dan pemilik di dasbor.
 */
const PASSWORD = 'Password123!';
const uniq = Date.now();
const tokens = {};

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  assert.equal(res.status, 200, `login gagal untuk ${email}`);
  return res.body.data.token;
};

const mkTenant = async (label) => {
  const res = await request(app).post('/api/auth/register').send({
    name: label,
    email: `${label.toLowerCase().replace(/\s+/g, '.')}.${uniq}@test.dev`,
    password: 'TestPass123',
    role: 'TENANT'
  });
  assert.ok([200, 201].includes(res.status), JSON.stringify(res.body));
  return res.body.data.token;
};

let ownerToken, tenantToken, otherTenantToken, kosId, roomId, bookingId, paymentId;

before(async () => {
  ownerToken = await login('anton@singgah.test');
  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${ownerToken}`);
  const ownerId = me.body.data.id;

  tenantToken = await mkTenant('Pembayar Satu');
  otherTenantToken = await mkTenant('Pembayar Dua');

  // Cari kos milik anton yang masih punya kamar tersedia.
  const list = await request(app).get('/api/kos?limit=50');
  for (const k of list.body.data) {
    const detail = await request(app).get(`/api/kos/${k.id}`);
    const room = (detail.body.data.rooms || []).find(r => r.status === 'AVAILABLE');
    if (detail.body.data.ownerId === ownerId && room) {
      kosId = k.id;
      roomId = room.id;
      break;
    }
  }
  assert.ok(kosId, 'butuh kos milik anton dengan kamar AVAILABLE');

  const booking = await request(app).post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ kosId, roomId, durasiBulan: 1, totalHarga: 1200000 });
  assert.ok([200, 201].includes(booking.status), JSON.stringify(booking.body));
  bookingId = booking.body.data.id;
});

test('menolak pembayaran tanpa field wajib', async () => {
  const res = await request(app).post('/api/payments')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ bookingId });
  assert.equal(res.status, 400);
});

test('penyewa mengirim bukti pembayaran dan pemiliknya dapat notifikasi', async () => {
  const res = await request(app).post('/api/payments')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ bookingId, metodePembayaran: 'TRANSFER', namaRekening: 'BCA', nomorRekening: '1234567890', jumlahTransfer: 1200000, catatan: 'sudah transfer' });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  paymentId = res.body.data.id;
  assert.equal(res.body.data.status, 'PENDING');
  assert.equal(res.body.data.ownerId, (await request(app).get(`/api/kos/${kosId}`)).body.data.ownerId);

  const notif = await request(app).get('/api/notifications')
    .set('Authorization', `Bearer ${ownerToken}`);
  const list = notif.body.data.notifications || [];
  assert.ok(list.some(n => n.title.includes('Bukti Pembayaran')), 'pemilik harus menerima notifikasi bukti bayar');

  const duplikat = await request(app).post('/api/payments')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ bookingId, metodePembayaran: 'TRANSFER', jumlahTransfer: 1200000 });
  assert.equal(duplikat.status, 400, 'belum ada PENDING lain tidak boleh dobel');
});

test('hanya penyewa pemilik booking yang bisa melihat detailnya', async () => {
  const mine = await request(app).get(`/api/payments/booking/${bookingId}`)
    .set('Authorization', `Bearer ${tenantToken}`);
  assert.equal(mine.status, 200);
  assert.equal(mine.body.data.id, paymentId);

  const asing = await request(app).get(`/api/payments/booking/${bookingId}`)
    .set('Authorization', `Bearer ${otherTenantToken}`);
  assert.equal(asing.status, 404, 'penyewa lain tidak boleh melihat bukti orang lain');
});

test('pemilik melihat pembayaran masuk dan bisa mengonfirmasinya', async () => {
  const inbox = await request(app).get('/api/payments/owner')
    .set('Authorization', `Bearer ${ownerToken}`);
  assert.equal(inbox.status, 200);
  assert.ok(inbox.body.data.some(p => p.id === paymentId));
  assert.equal(inbox.body.data.find(p => p.id === paymentId).kos.id, kosId);

  const sebelum = await request(app).get('/api/payments/summary/owner')
    .set('Authorization', `Bearer ${ownerToken}`);
  assert.ok(sebelum.body.data.menungguKonfirmasi >= 1200000);
  assert.equal(sebelum.body.data.monthlyData.length, 6);

  const confirm = await request(app).patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ action: 'confirm' });
  assert.equal(confirm.status, 200, JSON.stringify(confirm.body));
  assert.equal(confirm.body.data.status, 'CONFIRMED');

  const booking = await request(app).get('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantToken}`);
  assert.equal(booking.body.data.find(b => b.id === bookingId).status, 'COMPLETED', 'booking harus ikut selesai');

  const sesudah = await request(app).get('/api/payments/summary/owner')
    .set('Authorization', `Bearer ${ownerToken}`);
  assert.ok(sesudah.body.data.totalPendapatan >= 1200000);

  const duaKali = await request(app).patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ action: 'confirm' });
  assert.equal(duaKali.status, 400, 'konfirmasi kedua harus ditolak');
});

test('owner lain tidak bisa mengonfirmasi pembayaran milik orang lain', async () => {
  const sitiToken = await login('siti@singgah.test');
  const res = await request(app).patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${sitiToken}`)
    .send({ action: 'confirm' });
  assert.equal(res.status, 404);
});

test('setelah ditolak, bukti yang dikirim ulang yang tampil — bukan yang lama', async () => {
  // Booking baru di kos yang sama: yang lama sudah COMPLETED.
  const detail = await request(app).get(`/api/kos/${kosId}`);
  const room = (detail.body.data.rooms || []).find(r => r.status === 'AVAILABLE');
  assert.ok(room, 'butuh kamar AVAILABLE kedua');
  const booking = await request(app).post('/api/tenant/bookings')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ kosId, roomId: room.id, durasiBulan: 1, totalHarga: 900000 });
  assert.ok([200, 201].includes(booking.status), JSON.stringify(booking.body));
  const bkg = booking.body.data.id;

  const kirim = (nomor) => request(app).post('/api/payments')
    .set('Authorization', `Bearer ${tenantToken}`)
    .send({ bookingId: bkg, metodePembayaran: 'TRANSFER', namaRekening: 'BRI', nomorRekening: nomor, jumlahTransfer: 900000 });

  const pertama = await kirim('1111111111');
  assert.equal(pertama.status, 201);
  const ditolak = await request(app).patch(`/api/payments/${pertama.body.data.id}/confirm`)
    .set('Authorization', `Bearer ${ownerToken}`)
    .send({ action: 'reject', alasanPenolakan: 'nomor rekening tidak sama' });
  assert.equal(ditolak.status, 200);

  const kedua = await kirim('2222222222');
  assert.equal(kedua.status, 201, 'bukti baru boleh dikirim setelah yang lama ditolak');

  const lihat = await request(app).get(`/api/payments/booking/${bkg}`)
    .set('Authorization', `Bearer ${tenantToken}`);
  assert.equal(lihat.body.data.id, kedua.body.data.id, 'detail harus menunjukkan bukti terakhir');
  assert.equal(lihat.body.data.nomorRekening, '2222222222');
});
