# KosFinder — Platform Pencarian & Pengelolaan Kos

Aplikasi full-stack untuk mencari kos (pencari), mengelola properti kos (pemilik), dan memoderasi platform (admin). Dibangun dengan React + Express + PostgreSQL/Prisma dengan fallback penyimpanan in-memory untuk development tanpa database.

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| Frontend | React 18, Vite 6, Tailwind CSS 3, React Router 7, Axios, Leaflet (peta), lucide-react |
| Backend | Node.js, Express 4, Prisma ORM 5, JWT, bcryptjs, helmet, cors, express-rate-limit, multer, nodemailer |
| Database | PostgreSQL (produksi) — fallback in-memory store otomatis saat PostgreSQL tidak tersedia |

## Struktur Proyek

```
├── client/                 # Frontend React (Vite)
│   ├── src/components/     # KosCard, KosMap, NotificationBell, modal, dll.
│   ├── src/pages/          # 14 halaman (Home, Search, Detail, Dashboard Tenant/Owner/Admin, Chat, Auth, About, Owner Landing) + NotFound inline di App.jsx
│   ├── src/data/           # campuses.js (katalog kampus & kota — satu sumber kebenaran), indonesiaMap.js (geometri peta, hasil generate)
│   ├── src/context/        # AuthContext (JWT + restore sesi)
│   ├── src/services/api.js # Axios instance + interceptor Bearer token
│   └── scripts/            # generate-indonesia-map.mjs (npm run generate:map)
├── server/
│   ├── prisma/             # schema.prisma (11 model), seed.js, seedData.js (12 kos)
│   └── src/
│       ├── controllers/    # auth, kos, tenant, owner, admin, chat, review, upload, dll.
│       ├── routes/         # Mounting /api/*
│       ├── middleware/     # authenticate, authorize (role), upload (multer), error handler
│       └── services/       # db.js (Prisma ⇄ memory store), campusKeywords.js, storage.js, mailer.js, prisma.js
└── .env.example            # Contoh konfigurasi environment
```

## Instalasi

Prasyarat: **Node.js 22 LTS** (dipakai di `engines`, `.node-version`, dan `render.yaml`).

```bash
# 1. Install dependensi
cd server && npm install
cd ../client && npm install

# 2. Siapkan environment
cp ../.env.example server/.env      # lalu sesuaikan nilainya
# (opsional) buat client/.env untuk VITE_* vars

# 3. Jalankan (dua terminal)
cd server && npm run dev            # API di http://localhost:5000
cd client && npm run dev            # Web di http://localhost:5173
```

## Database Setup (PostgreSQL)

Aplikasi **otomatis memakai in-memory store berisi data seed** bila PostgreSQL tidak dapat dihubungi — cocok untuk development cepat. Untuk mode database penuh:

```bash
cd server
# 1. Pastikan PostgreSQL berjalan dan DATABASE_URL di server/.env benar
# 2. Generate client & migrasi
npm run prisma:generate
npm run prisma:migrate
# 3. Isi data awal (12 kos, 4 user demo, kamar, booking, ulasan)
npm run prisma:seed
```

## Demo Account

Semua akun demo memakai password: **Password123!**

| Peran | Email | Keterangan |
|---|---|---|
| ADMIN | admin@kosfinder.com | Akses Admin Panel (verifikasi listing, moderasi) |
| OWNER | anton@kosfinder.com | Pemilik 7 properti (dasbor pemilik) |
| OWNER | siti@kosfinder.com | Pemilik 5 properti (kos putri) |
| TENANT | rian@gmail.com | Pencari kos (punya booking & favorit siap uji) |

## Fitur Utama

- **Autentikasi lengkap**: register (tenant/owner), login JWT, lupa/reset password via email (SMTP opsional, fallback console di dev)
- **Pencarian & filter**: kata kunci, kota, rentang harga, tipe kos, fasilitas, urutkan, pagination
- **Detail kos**: galeri foto, fasilitas, aturan, peta Leaflet (tile OpenStreetMap, bisa diganti via env), ulasan & rating
- **Booking**: pengajuan sewa dengan proteksi double-booking (race-condition guard + transaksi)
- **Chat**: percakapan tenant ⇄ owner per properti (polling 5 detik)
- **Dasbor pemilik**: CRUD properti & kamar, upload multi-foto (maks 8, foto utama), persetujuan booking, pembayaran & keuangan, balas ulasan
- **Dasbor tenant**: booking saya, favorit, pembayaran, profil
- **Admin panel**: statistik, verifikasi listing, moderasi ulasan & laporan, kelola pengguna
- **Keamanan**: hash bcrypt, otorisasi role di backend, rate limit, helmet, validasi upload (MIME + ukuran)

## Testing

```bash
cd server && npm test     # 29 tes: test/api.test.js + test/campus-catalog.test.js (guard sinkronisasi id kampus client ⇄ server)
```

## Perintah lain

```bash
cd client && npm run build          # produksi → client/dist (chunk dipecah per rute)
cd client && npm run generate:map   # bangkitkan ulang src/data/indonesiaMap.js dari dotted-map
```

## Environment Variables

Lihat [.env.example](.env.example) untuk daftar lengkap. Ringkasan:

- **Server**: `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `CLIENT_URL`, `RATE_LIMIT_MAX`, `STORAGE_DRIVER`, `UPLOAD_DIR`, `UPLOAD_MAX_SIZE`, `PUBLIC_BASE_URL`, `SMTP_HOST/PORT/USER/PASS`, `MAIL_FROM`
- **Client**: `VITE_MAP_TILE_URL`, `VITE_MAP_TILE_ATTRIBUTION`, `VITE_SUPPORT_EMAIL`, `VITE_TURNSTILE_SITE_KEY`. Client selalu memanggil `/api` pada origin yang sama (proxy Vite di dev, static + reverse proxy di prod) — `VITE_API_BASE_URL` di `.env.example` memang tidak dibaca kode.

## Deployment

1. **Database**: sediakan PostgreSQL (mis. Supabase/Neon/RDS), set `DATABASE_URL`, jalankan `prisma migrate deploy` dan seed.
2. **Server**: `cd server && npm ci && npm start` di belakang reverse proxy (Nginx). Set `NODE_ENV=production`, ganti `JWT_SECRET`, isi `SMTP_*` agar email reset password terkirim.
3. **Client**: `cd client && npm ci && npm run build`, sajikan `client/dist` via hosting statis (Nginx/Vercel/Netlify). Set `VITE_API_BASE_URL` ke URL API publik dan konfigurasi proxy `/uploads` ke server bila storage lokal dipakai.
4. **Uploads**: untuk produksi multi-instance, ganti `STORAGE_DRIVER` ke provider objek (struktur `storage.js` sudah menyiapkan abstraksinya).

## Known Limitations

- Peta memakai tile OpenStreetMap gratis (tanpa geocoding pencarian alamat); provider berbayar dapat dipasang via `VITE_MAP_TILE_URL`.
- Chat memakai polling 5 detik, bukan WebSocket.
- Token reset password disimpan in-memory (hilang saat restart server) — untuk produksi disarankan tabel database.
- Mode in-memory store tidak persisten antar-restart (kembali ke data seed).
- **Filter `campus`/`landmark`, `facilities`, dan `rules` hanya diterapkan pada memory store.** Cabang query Prisma belum memakai opsi-opsi itu, jadi hasil pencarian per kampus akan berhenti menyaring begitu PostgreSQL aktif. Belum diperbaiki karena tidak bisa direproduksi maupun diverifikasi tanpa instance Postgres.
