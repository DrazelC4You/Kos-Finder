import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
const { default: app } = await import('../src/app.js');
const { googleAuth } = await import('../src/services/googleAuth.js');
const db = (await import('../src/services/db.js')).default;

// Verifier Google ditambal: tes tidak boleh menyentuh jaringan Google, dan
// controller memanggil googleAuth.verifyCredential() lewat objek sehingga
// tambalan t.mock.method terlihat di sana.
const stubVerify = (t, payload) => {
  t.mock.method(googleAuth, 'verifyCredential', async () => payload);
};

const uniq = Date.now();
const NEW_USER = {
  sub: `google-sub-${uniq}`,
  email: `google.${uniq}@gmail.com`,
  email_verified: true,
  name: 'Ransel Google',
  picture: 'https://example.test/avatar.png'
};

before(async () => {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id.apps.googleusercontent.com';
});

test('POST /api/auth/google menolak saat client ID belum dikonfigurasi', async (t) => {
  const saved = process.env.GOOGLE_CLIENT_ID;
  delete process.env.GOOGLE_CLIENT_ID;
  t.after(() => { process.env.GOOGLE_CLIENT_ID = saved; });

  const res = await request(app).post('/api/auth/google').send({ credential: 'apa-adanya' });
  assert.equal(res.status, 503);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/google menolak kredensial yang tidak lolos verifikasi', async (t) => {
  stubVerify(t, null);
  const res = await request(app).post('/api/auth/google').send({ credential: 'token-kadaluarsa' });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('POST /api/auth/google membuat akun TENANT baru dan idempoten per subjek', async (t) => {
  stubVerify(t, NEW_USER);

  const first = await request(app).post('/api/auth/google').send({ credential: 'id-token-1' });
  assert.equal(first.status, 200, JSON.stringify(first.body));
  assert.ok(first.body.data.token);
  assert.equal(first.body.data.user.role, 'TENANT');
  assert.equal(first.body.data.user.email, NEW_USER.email);
  assert.equal(first.body.data.user.emailVerified, true);

  const byEmail = await db.findUserByEmail(NEW_USER.email);
  assert.equal(byEmail.googleId, NEW_USER.sub);

  stubVerify(t, { ...NEW_USER });
  const second = await request(app).post('/api/auth/google').send({ credential: 'id-token-2' });
  assert.equal(second.status, 200);
  assert.equal(second.body.data.user.id, first.body.data.user.id, 'login kedua tidak boleh membuat akun kembar');
});

test('POST /api/auth/google menautkan ke akun email yang sudah ada', async (t) => {
  const email = 'rian@gmail.com';
  const before = await db.findUserByEmail(email);
  assert.ok(before, 'akun demo tenant harus ada di seed');
  const sub = `google-sub- existing-${uniq}`;

  stubVerify(t, { sub, email, email_verified: true, name: 'Rian Pratama', picture: null });
  const linked = await request(app).post('/api/auth/google').send({ credential: 'id-token-3' });
  assert.equal(linked.status, 200, JSON.stringify(linked.body));
  assert.equal(linked.body.data.user.id, before.id, 'email yang sama harus ditautkan, bukan diduplikasi');
  assert.equal(linked.body.data.user.role, before.role, 'role akun lama tidak boleh berubah');

  const after = await db.findUserByEmail(email);
  assert.equal(after.googleId, sub);

  // Login berikutnya lewat googleId, tanpa perlu lookup email lagi.
  stubVerify(t, { sub, email, email_verified: true, name: 'Rian Pratama', picture: null });
  const again = await request(app).post('/api/auth/google').send({ credential: 'id-token-4' });
  assert.equal(again.status, 200);
  assert.equal(again.body.data.user.id, before.id);
});

test('login password akun biasa tetap jalan setelah perubahan skema', async () => {
  const res = await request(app).post('/api/auth/login').send({
    email: 'anton@kosfinder.com',
    password: 'Password123!'
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, 'OWNER');
});
