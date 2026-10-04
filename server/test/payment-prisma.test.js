import { test, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Jalur Prisma untuk API pembayaran.
 *
 * Sebelum model `Payment` ada, keenam method ini selalu jatuh ke memory store
 * dengan komentar "Payment belum ada di schema Prisma" — artinya bukti transfer
 * dan status konfirmasinya hilang setiap kali proses restart. Test ini menjepit
 * perilaku jalur Prisma (validasi, siapa yang dapat notifikasi, efek ke booking)
 * dan membandingkan angka ringkasan keuangan dengan jalur memory pada baris yang
 * sama.
 */
process.env.NODE_ENV = 'test';

const prisma = (await import('../src/services/prisma.js')).default;
const { db, memoryStore } = await import('../src/services/db.js');
const { createPatcher } = await import('./patchPrisma.js');

const { patch, restore } = createPatcher();

mock.method(prisma, '$queryRaw', async () => [{ ok: 1 }]);

afterEach(() => {
  restore();
  mock.reset();
});

const BOOKING = {
  id: 'bkg-1',
  tenantId: 'usr-tenant',
  kosId: 'kos-1',
  status: 'PENDING',
  kos: { id: 'kos-1', nama: 'Kost Contoh', kota: 'Yogyakarta', ownerId: 'usr-owner' }
};

function stubCreate({ booking = BOOKING, existing = null } = {}) {
  const calls = { create: null, notify: null };
  patch(prisma.booking, 'findUnique', async () => booking);
  patch(prisma.payment, 'findFirst', async () => existing);
  patch(prisma.payment, 'create', async (args) => { calls.create = args; return { id: 'pay-1', status: 'PENDING', ...args.data }; });
  patch(prisma.user, 'findUnique', async () => ({ id: 'usr-tenant', name: 'Rian', phone: '0812' }));
  patch(prisma.notification, 'create', async (args) => { calls.notify = args; return args.data; });
  return calls;
}

test('createPayment menolak booking yang tidak layak bayar', async () => {
  const params = { bookingId: 'bkg-1', tenantId: 'usr-tenant', metodePembayaran: 'TRANSFER', namaRekening: 'BCA', nomorRekening: '123', jumlahTransfer: 1000000 };

  stubCreate({ booking: null });
  await assert.rejects(() => db.createPayment(params), /Booking tidak ditemukan/);

  stubCreate({ booking: { ...BOOKING, tenantId: 'usr-orang-lain' } });
  await assert.rejects(() => db.createPayment(params), /tidak memiliki akses/);

  stubCreate({ booking: { ...BOOKING, status: 'COMPLETED' } });
  await assert.rejects(() => db.createPayment(params), /booking yang masih aktif/);

  stubCreate({ existing: { id: 'pay-lama', status: 'PENDING' } });
  await assert.rejects(() => db.createPayment(params), /menunggu konfirmasi/);
});

test('createPayment menyimpan ownerId dari kos dan memberi tahu pemilik', async () => {
  const calls = stubCreate();
  const result = await db.createPayment({
    bookingId: 'bkg-1', tenantId: 'usr-tenant', metodePembayaran: 'TRANSFER',
    namaRekening: 'BCA', nomorRekening: '1234', jumlahTransfer: 1250000, catatan: 'sudah transfer'
  });

  assert.equal(calls.create.data.ownerId, 'usr-owner', 'ownerId harus berasal dari kos, bukan dari pemanggil');
  assert.equal(calls.create.data.kosId, 'kos-1');
  assert.equal(calls.create.data.tenantId, 'usr-tenant');
  assert.equal(calls.create.data.status, undefined, 'status dibiarkan default PENDING di database');
  assert.equal(calls.notify.data.userId, 'usr-owner');
  assert.match(calls.notify.data.message, /1\.250\.000/);
  assert.equal(result.kos.nama, 'Kost Contoh');
});

function stubProcess({ payment = { id: 'pay-1', ownerId: 'usr-owner', tenantId: 'usr-tenant', bookingId: 'bkg-1', status: 'PENDING', jumlahTransfer: 1250000, alasanPenolakan: '', kos: { id: 'kos-1', nama: 'Kost Contoh', ownerId: 'usr-owner' } } } = {}) {
  const calls = { update: null, bookingUpdate: null, notify: null };
  patch(prisma.payment, 'findUnique', async () => payment);
  patch(prisma.payment, 'update', async (args) => { calls.update = args; return { ...payment, ...args.data }; });
  patch(prisma.booking, 'update', async (args) => { calls.bookingUpdate = args; return {}; });
  patch(prisma.booking, 'findUnique', async () => ({ id: 'bkg-1', status: 'COMPLETED' }));
  patch(prisma.user, 'findUnique', async () => ({ id: 'usr-tenant', name: 'Rian' }));
  patch(prisma.notification, 'create', async (args) => { calls.notify = args; return args.data; });
  return calls;
}

test('processPaymentConfirmation menjaga kepemilikan dan status', async () => {
  stubProcess();
  assert.equal(await db.processPaymentConfirmation('pay-1', 'usr-bukan-pemilik', 'confirm'), null);

  stubProcess({ payment: { id: 'pay-1', ownerId: 'usr-owner', tenantId: 'usr-tenant', bookingId: 'bkg-1', status: 'CONFIRMED', jumlahTransfer: 1, kos: { id: 'kos-1', nama: 'Kost Contoh' } } });
  await assert.rejects(() => db.processPaymentConfirmation('pay-1', 'usr-owner', 'confirm'), /sudah diproses/);
});

test('confirm menyelesaikan booking; reject mencatat alasan tanpa menyentuh booking', async () => {
  const confirmed = stubProcess();
  const hasilConfirm = await db.processPaymentConfirmation('pay-1', 'usr-owner', 'confirm');
  assert.equal(confirmed.update.data.status, 'CONFIRMED');
  assert.equal(confirmed.bookingUpdate.data.status, 'COMPLETED');
  assert.equal(confirmed.notify.data.userId, 'usr-tenant');
  assert.equal(hasilConfirm.booking.id, 'bkg-1');

  const rejected = stubProcess();
  await db.processPaymentConfirmation('pay-1', 'usr-owner', 'reject', 'nomor rekening tidak sama');
  assert.equal(rejected.update.data.status, 'REJECTED');
  assert.equal(rejected.update.data.alasanPenolakan, 'nomor rekening tidak sama');
  assert.equal(rejected.bookingUpdate, null, 'booking tidak boleh berubah saat ditolak');
  assert.match(rejected.notify.data.message, /nomor rekening tidak sama/);
});

test('ringkasan keuangan pemilik identik di jalur Prisma dan memory', async () => {
  const rows = [
    { ownerId: 'usr-lap', status: 'CONFIRMED', jumlahTransfer: '1500000.50', updatedAt: new Date() },
    { ownerId: 'usr-lap', status: 'CONFIRMED', jumlahTransfer: 750000, updatedAt: new Date() },
    { ownerId: 'usr-lap', status: 'PENDING', jumlahTransfer: 900000, updatedAt: new Date() },
    { ownerId: 'usr-lap', status: 'REJECTED', jumlahTransfer: 300000, updatedAt: new Date() },
    // sengaja di luar bulan ini: tidak boleh masuk monthlyData bulan berjalan
    { ownerId: 'usr-lap', status: 'CONFIRMED', jumlahTransfer: 100, updatedAt: new Date('2020-01-15T00:00:00Z') }
  ];
  memoryStore.payments.push(...rows);

  const expected = await memoryStore.getOwnerFinancialSummary('usr-lap');
  patch(prisma.payment, 'findMany', async (args) => {
    assert.equal(args.where.ownerId, 'usr-lap');
    return rows;
  });
  const actual = await db.getOwnerFinancialSummary('usr-lap');

  assert.deepEqual(actual, expected);
  // 1.500.000,50 + 750.000 + 100 (baris 2020 tetap dihitung sebagai pendapatan,
  // hanya tidak masuk bulan berjalan)
  assert.equal(actual.totalPendapatan, 2250100.5);
  assert.equal(actual.menungguKonfirmasi, 900000);
  assert.equal(actual.monthlyData.length, 6);
  assert.equal(actual.monthlyData[5].jumlahTransaksi, 2, 'baris 2020 tidak boleh masuk bulan berjalan');

  memoryStore.payments = memoryStore.payments.filter(p => p.ownerId !== 'usr-lap');
});
