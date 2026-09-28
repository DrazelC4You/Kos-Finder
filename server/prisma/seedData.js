import bcrypt from 'bcryptjs';

// Password seragam untuk semua akun demo development: "Password123!"
const defaultHashedPassword = bcrypt.hashSync('Password123!', 10);

export const seedUsers = [
  // 1. ADMIN
  {
    id: 'usr-admin-01',
    email: 'admin@kosfinder.com',
    password: defaultHashedPassword,
    name: 'Admin KosFinder',
    phone: '081122334455',
    role: 'ADMIN',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    profile: {
      bio: 'Administrator resmi platform KosFinder',
      gender: 'Laki-laki',
      occupation: 'Platform Moderator',
      address: 'Jakarta Pusat'
    }
  },

  // 2. OWNER 1 (Bapak Anton)
  {
    id: 'usr-owner-01',
    email: 'anton@kosfinder.com',
    password: defaultHashedPassword,
    name: 'Bapak Anton Harmono',
    phone: '081234567890',
    role: 'OWNER',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    profile: {
      bio: 'Pemilik Kos Harmoni dan Graha Asri di Purwokerto sejak 2018',
      gender: 'Laki-laki',
      occupation: 'Pengusaha Properti',
      address: 'Jl. Dr. Soeparno No. 45, Purwokerto'
    }
  },

  // 3. OWNER 2 (Ibu Hj. Siti Aminah)
  {
    id: 'usr-owner-02',
    email: 'siti@kosfinder.com',
    password: defaultHashedPassword,
    name: 'Hj. Siti Aminah',
    phone: '081377889900',
    role: 'OWNER',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    profile: {
      bio: 'Mengelola kos putri eksklusif dengan lingkungan aman dan kondusif',
      gender: 'Perempuan',
      occupation: 'Wiraswasta',
      address: 'Jl. Kampus No. 12, Purwokerto'
    }
  },

  // 4. TENANT 1 (Rian Pratama)
  {
    id: 'usr-tenant-01',
    email: 'rian@gmail.com',
    password: defaultHashedPassword,
    name: 'Rian Pratama',
    phone: '085611223344',
    role: 'TENANT',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    profile: {
      bio: 'Mahasiswa Teknik Informatika tingkat akhir',
      gender: 'Laki-laki',
      occupation: 'Mahasiswa',
      address: 'Asal Tegal'
    }
  },

  // 5. TENANT 2 (Annisa Putri)
  {
    id: 'usr-tenant-02',
    email: 'annisa@gmail.com',
    password: defaultHashedPassword,
    name: 'Annisa Putri',
    phone: '087811223344',
    role: 'TENANT',
    isVerified: true,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    profile: {
      bio: 'Mahasiswi Kedokteran Unsoed',
      gender: 'Perempuan',
      occupation: 'Mahasiswi',
      address: 'Asal Semarang'
    }
  }
];

export const seedKos = [
  {
    id: 'kos-01',
    ownerId: 'usr-owner-01',
    nama: 'Kost Harmoni Asri',
    deskripsi: 'Kost Harmoni berlokasi sangat strategis di pusat kota Purwokerto, dekat dengan area kampus dan pusat kuliner. Suasana tenang, asri, sirkulasi udara baik, dan lingkungan aman dengan pengawasan CCTV.',
    alamat: 'Jl. Dr. Soeparno No. 45, Grendeng',
    kota: 'Purwokerto',
    latitude: -7.4243,
    longitude: 109.2486,
    hargaBulanan: 750000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['WiFi', 'Kamar mandi dalam', 'Parkir', 'Listrik', 'Kasur', 'Lemari', 'CCTV'],
    aturan: 'Jam malam pukul 23.00 WIB. Dilarang merokok di dalam kamar. Tamu lawan jenis dilarang menginap di kamar. Jaga ketertiban.',
    rating: 4.8,
    jumlahReview: 12,
    totalKamar: 6,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-01-01', nomorKamar: 'Kamar 01', harga: 750000, status: 'OCCUPIED', tenantId: 'usr-tenant-01', tanggalMulaiSewa: new Date('2026-08-01') },
      { id: 'rm-01-02', nomorKamar: 'Kamar 02', harga: 750000, status: 'AVAILABLE' },
      { id: 'rm-01-03', nomorKamar: 'Kamar 03', harga: 750000, status: 'AVAILABLE' },
      { id: 'rm-01-04', nomorKamar: 'Kamar 04', harga: 750000, status: 'OCCUPIED' },
      { id: 'rm-01-05', nomorKamar: 'Kamar 05', harga: 750000, status: 'OCCUPIED' },
      { id: 'rm-01-06', nomorKamar: 'Kamar 06', harga: 750000, status: 'MAINTENANCE' }
    ]
  },
  {
    id: 'kos-02',
    ownerId: 'usr-owner-02',
    nama: 'Kost Melati Eksklusif Putri',
    deskripsi: 'Kost eksklusif putri berfasilitas lengkap dengan AC, kamar mandi dalam, dan WiFi kecepatan tinggi. Suasana asri, bersih, serta dilengkapi dapur bersama dan ruang belajar bersama yang nyaman.',
    alamat: 'Jl. Kampus No. 12, Grendeng',
    kota: 'Purwokerto',
    latitude: -7.4221,
    longitude: 109.2512,
    hargaBulanan: 1100000,
    type: 'PUTRI',
    foto: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'WiFi', 'Kamar mandi dalam', 'Parkir', 'Akses 24 Jam', 'Kasur', 'Lemari', 'Dapur Bersama', 'CCTV'],
    aturan: 'Khusus putri. Pria dilarang masuk area lorong kamar (tersedia ruang tamu depan). Pintu gerbang sistem smart lock 24 jam.',
    rating: 4.9,
    jumlahReview: 18,
    totalKamar: 8,
    kamarTersedia: 3,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-02-01', nomorKamar: 'Kamar 101', harga: 1100000, status: 'OCCUPIED', tenantId: 'usr-tenant-02', tanggalMulaiSewa: new Date('2026-07-15') },
      { id: 'rm-02-02', nomorKamar: 'Kamar 102', harga: 1100000, status: 'AVAILABLE' },
      { id: 'rm-02-03', nomorKamar: 'Kamar 103', harga: 1100000, status: 'AVAILABLE' },
      { id: 'rm-02-04', nomorKamar: 'Kamar 104', harga: 1100000, status: 'AVAILABLE' },
      { id: 'rm-02-05', nomorKamar: 'Kamar 105', harga: 1100000, status: 'OCCUPIED' },
      { id: 'rm-02-06', nomorKamar: 'Kamar 106', harga: 1100000, status: 'OCCUPIED' },
      { id: 'rm-02-07', nomorKamar: 'Kamar 107', harga: 1100000, status: 'OCCUPIED' },
      { id: 'rm-02-08', nomorKamar: 'Kamar 108', harga: 1100000, status: 'RESERVED' }
    ]
  },
  {
    id: 'kos-03',
    ownerId: 'usr-owner-01',
    nama: 'Kost Sejahtera Putra',
    deskripsi: 'Kost khusus putra dengan harga terjangkau di kawasan Kembaran. Sangat cocok bagi mahasiswa yang mencari hunian tenang dengan area parkir motor yang luas dan berpagar aman.',
    alamat: 'Jl. Raya Kembaran KM 2',
    kota: 'Kembaran',
    latitude: -7.4367,
    longitude: 109.2814,
    hargaBulanan: 600000,
    type: 'PUTRA',
    foto: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['WiFi', 'Parkir', 'Listrik', 'Kasur', 'Lemari'],
    aturan: 'Bebas jam malam dengan kunci gerbang masing-masing. Tamu menginap wajib melapor kepada pengelola kos.',
    rating: 4.5,
    jumlahReview: 8,
    totalKamar: 5,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-03-01', nomorKamar: 'Kamar A1', harga: 600000, status: 'AVAILABLE' },
      { id: 'rm-03-02', nomorKamar: 'Kamar A2', harga: 600000, status: 'AVAILABLE' },
      { id: 'rm-03-03', nomorKamar: 'Kamar A3', harga: 600000, status: 'OCCUPIED' },
      { id: 'rm-03-04', nomorKamar: 'Kamar A4', harga: 600000, status: 'OCCUPIED' },
      { id: 'rm-03-05', nomorKamar: 'Kamar A5', harga: 600000, status: 'OCCUPIED' }
    ]
  },
  {
    id: 'kos-04',
    ownerId: 'usr-owner-01',
    nama: 'Kost Graha Asri Sokaraja',
    deskripsi: 'Hunian nyaman bernuansa modern minimalis di Sokaraja. Akses cepat ke jalan raya nasional, rumah sakit, dan pusat kuliner getuk goreng. Lingkungan bersih dan asri.',
    alamat: 'Jl. Jenderal Sudirman No. 88',
    kota: 'Sokaraja',
    latitude: -7.4589,
    longitude: 109.2611,
    hargaBulanan: 850000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['WiFi', 'Kamar mandi dalam', 'Parkir', 'Akses 24 Jam', 'Kasur', 'Lemari'],
    aturan: 'Harap menjaga ketenangan di atas pukul 22.00 WIB. Dilarang membawa hewan peliharaan.',
    rating: 4.7,
    jumlahReview: 6,
    totalKamar: 4,
    kamarTersedia: 1,
    status: 'ACTIVE',
    isVerified: false,
    rooms: [
      { id: 'rm-04-01', nomorKamar: 'Kamar 01', harga: 850000, status: 'AVAILABLE' },
      { id: 'rm-04-02', nomorKamar: 'Kamar 02', harga: 850000, status: 'OCCUPIED' },
      { id: 'rm-04-03', nomorKamar: 'Kamar 03', harga: 850000, status: 'OCCUPIED' },
      { id: 'rm-04-04', nomorKamar: 'Kamar 04', harga: 850000, status: 'OCCUPIED' }
    ]
  },
  // 5. YOGYAKARTA (UGM & Kaliurang)
  {
    id: 'kos-05',
    ownerId: 'usr-owner-01',
    nama: 'Kost Graha Kalyana UGM',
    deskripsi: 'Kost eksklusif dekat kampus UGM & UNY. Hanya 5 menit ke Fakultas Teknik & Kedokteran UGM. Fasilitas kamar full furnished lengkap dengan AC, water heater, dan WiFi kencang 100 Mbps.',
    alamat: 'Jl. Kaliurang KM 5, Gang Pandega Marta No. 28',
    kota: 'Yogyakarta',
    latitude: -7.7602,
    longitude: 110.3804,
    hargaBulanan: 1350000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'Meja & Kursi', 'Water Heater', 'Dapur Bersama', 'Parkir Mobil', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Akses gerbang 24 jam dengan fingerprint. Tamu menginap wajib konfirmasi pengelola.',
    rating: 4.9,
    jumlahReview: 24,
    totalKamar: 8,
    kamarTersedia: 3,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-05-01', nomorKamar: 'Kamar 101', harga: 1350000, status: 'AVAILABLE' },
      { id: 'rm-05-02', nomorKamar: 'Kamar 102', harga: 1350000, status: 'AVAILABLE' },
      { id: 'rm-05-03', nomorKamar: 'Kamar 103', harga: 1350000, status: 'AVAILABLE' },
      { id: 'rm-05-04', nomorKamar: 'Kamar 104', harga: 1350000, status: 'OCCUPIED' }
    ]
  },
  // 6. BANDUNG (ITB & Dago)
  {
    id: 'kos-06',
    ownerId: 'usr-owner-02',
    nama: 'Kost Dago Living ITB & UNPAD',
    deskripsi: 'Hunian asri dan sejuk di kawasan Dago Atas Bandung. Akses cepat ke kampus ITB Ganesha dan UNPAD Dipatiukur. Dilengkapi ruang belajar rooftop dan dapur bersama modern.',
    alamat: 'Jl. Dago Asri Raya No. 42, Coblong',
    kota: 'Bandung',
    latitude: -6.8789,
    longitude: 107.6189,
    hargaBulanan: 1600000,
    type: 'PUTRI',
    foto: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'Meja & Kursi', 'Water Heater', 'Dapur Bersama', 'Kulkas Bersama', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Khusus mahasiswi / karyawati. Dilarang merokok di area kamar.',
    rating: 4.8,
    jumlahReview: 15,
    totalKamar: 6,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-06-01', nomorKamar: 'Kamar 01', harga: 1600000, status: 'AVAILABLE' },
      { id: 'rm-06-02', nomorKamar: 'Kamar 02', harga: 1600000, status: 'AVAILABLE' }
    ]
  },
  // 7. JAKARTA SELATAN (Tebet & Kuningan)
  {
    id: 'kos-07',
    ownerId: 'usr-owner-01',
    nama: 'Kost Tebet Residence Eksekutif',
    deskripsi: 'Kost strategis di pusat Jakarta Selatan, hanya 5 menit ke Stasiun Tebet dan area perkantoran Kuningan/Sudirman. Fasilitas premium kamar mandi dalam dengan smart TV & WiFi fiber.',
    alamat: 'Jl. Tebet Barat Dalam VII No. 18',
    kota: 'Jakarta Selatan',
    latitude: -6.2345,
    longitude: 106.8521,
    hargaBulanan: 2100000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'TV', 'Water Heater', 'Mesin Cuci', 'Parkir Mobil', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Menerima karyawan/pasutri resmi (buku nikah). Bebas jam malam 24 jam.',
    rating: 4.9,
    jumlahReview: 31,
    totalKamar: 10,
    kamarTersedia: 4,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-07-01', nomorKamar: 'Kamar 201', harga: 2100000, status: 'AVAILABLE' },
      { id: 'rm-07-02', nomorKamar: 'Kamar 202', harga: 2100000, status: 'AVAILABLE' }
    ]
  },
  // 8. DEPOK (UI Margonda / Kukusan)
  {
    id: 'kos-08',
    ownerId: 'usr-owner-02',
    nama: 'Kost Mahasiswa UI Margonda',
    deskripsi: 'Lokasi super strategis tepat di belakang kampus Universitas Indonesia (UI) Depok. Jalan kaki 3 menit ke stasiun UI dan halte bikun.',
    alamat: 'Jl. Margonda Raya Gang Sawo No. 8, Pondok Cina',
    kota: 'Depok',
    latitude: -6.3689,
    longitude: 106.8321,
    hargaBulanan: 1200000,
    type: 'PUTRA',
    foto: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'Meja & Kursi', 'Dapur Bersama', 'Parkir Motor', 'CCTV'],
    aturan: 'Khusus mahasiswa / pekerja pria. Jam malam 23.00 WIB.',
    rating: 4.7,
    jumlahReview: 19,
    totalKamar: 6,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-08-01', nomorKamar: 'Kamar A1', harga: 1200000, status: 'AVAILABLE' },
      { id: 'rm-08-02', nomorKamar: 'Kamar A2', harga: 1200000, status: 'AVAILABLE' }
    ]
  },
  // 9. MALANG (Universitas Brawijaya / Suhat)
  {
    id: 'kos-09',
    ownerId: 'usr-owner-01',
    nama: 'Kost Suhat Brawijaya Malang',
    deskripsi: 'Kost mahasiswa favorit di kawasan jalan Soekarno Hatta Malang. Sangat dekat dengan gerbang utama Universitas Brawijaya (UB) & Polinema. Dikelilingi kafe dan minimarket 24 jam.',
    alamat: 'Jl. Soekarno Hatta Indah No. 45, Lowokwaru',
    kota: 'Malang',
    latitude: -7.9482,
    longitude: 112.6179,
    hargaBulanan: 950000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['WiFi', 'Kamar mandi dalam', 'Kasur', 'Lemari', 'Meja & Kursi', 'Dapur Bersama', 'Parkir Motor', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Bebas jam malam (kunci gerbang mandiri). Menjaga kenyamanan antar penghuni.',
    rating: 4.8,
    jumlahReview: 14,
    totalKamar: 8,
    kamarTersedia: 3,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-09-01', nomorKamar: 'Kamar 01', harga: 950000, status: 'AVAILABLE' },
      { id: 'rm-09-02', nomorKamar: 'Kamar 02', harga: 950000, status: 'AVAILABLE' }
    ]
  },
  // 10. SURABAYA (UNAIR & ITS)
  {
    id: 'kos-10',
    ownerId: 'usr-owner-02',
    nama: 'Kost Dharmawangsa UNAIR & ITS',
    deskripsi: 'Kost bersih dan modern dekat RSUD Dr. Soetomo dan Kampus B & C UNAIR Surabaya. Lingkungan tenang, aman, dan ber-AC dingin.',
    alamat: 'Jl. Dharmawangsa Barat No. 19, Gubeng',
    kota: 'Surabaya',
    latitude: -7.2721,
    longitude: 112.7562,
    hargaBulanan: 1400000,
    type: 'PUTRI',
    foto: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'Meja & Kursi', 'Water Heater', 'Kulkas Bersama', 'CCTV'],
    aturan: 'Khusus mahasiswi / karyawati. Pintu gerbang smartlock 24 jam.',
    rating: 4.9,
    jumlahReview: 22,
    totalKamar: 8,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-10-01', nomorKamar: 'Kamar 101', harga: 1400000, status: 'AVAILABLE' },
      { id: 'rm-10-02', nomorKamar: 'Kamar 102', harga: 1400000, status: 'AVAILABLE' }
    ]
  },
  // 11. SEMARANG (UNDIP Tembalang)
  {
    id: 'kos-11',
    ownerId: 'usr-owner-01',
    nama: 'Kost Tembalang Grand UNDIP',
    deskripsi: 'Kost nyaman mahasiswa di kawasan Tembalang Semarang, hanya 500 meter dari gerbang utama Universitas Diponegoro (UNDIP). Dilengkapi area parkir mobil luas.',
    alamat: 'Jl. Banjarsari Selatan No. 33, Tembalang',
    kota: 'Semarang',
    latitude: -7.0543,
    longitude: 110.4389,
    hargaBulanan: 1100000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'Meja & Kursi', 'Dapur Bersama', 'Parkir Mobil', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Bebas jam malam. Dilarang membawa miras / narkoba.',
    rating: 4.8,
    jumlahReview: 16,
    totalKamar: 6,
    kamarTersedia: 2,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-11-01', nomorKamar: 'Kamar 01', harga: 1100000, status: 'AVAILABLE' },
      { id: 'rm-11-02', nomorKamar: 'Kamar 02', harga: 1100000, status: 'AVAILABLE' }
    ]
  },
  // 12. BALI (Denpasar / Renon / Udayana)
  {
    id: 'kos-12',
    ownerId: 'usr-owner-02',
    nama: 'Kost Bali Sunset Residence Renon',
    deskripsi: 'Kost bergaya villa modern tropis di pusat Denpasar Bali (Renon). Sangat cocok untuk digital nomad, mahasiswa Universitas Udayana, maupun profesional muda.',
    alamat: 'Jl. Tukad Batanghari No. 55, Renon',
    kota: 'Denpasar',
    latitude: -8.6789,
    longitude: 115.2341,
    hargaBulanan: 1850000,
    type: 'CAMPUR',
    foto: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=60'
    ],
    fasilitas: ['AC', 'Kamar mandi dalam', 'WiFi', 'Kasur', 'Lemari', 'TV', 'Water Heater', 'Dapur Bersama', 'Parkir Mobil', 'Akses 24 Jam', 'CCTV'],
    aturan: 'Bebas jam malam 24 jam. Pasutri & WNA welcome.',
    rating: 5.0,
    jumlahReview: 28,
    totalKamar: 8,
    kamarTersedia: 3,
    status: 'ACTIVE',
    isVerified: true,
    rooms: [
      { id: 'rm-12-01', nomorKamar: 'Kamar V1', harga: 1850000, status: 'AVAILABLE' },
      { id: 'rm-12-02', nomorKamar: 'Kamar V2', harga: 1850000, status: 'AVAILABLE' }
    ]
  }
];

export const seedBookings = [
  {
    id: 'bkg-01',
    tenantId: 'usr-tenant-01',
    kosId: 'kos-01',
    roomId: 'rm-01-01',
    tanggalMulai: new Date('2026-08-01'),
    durasiBulan: 6,
    totalHarga: 4500000,
    status: 'APPROVED',
    catatan: 'Mahasiswa Informatika Unsoed, pembayaran lunas.'
  },
  {
    id: 'bkg-02',
    tenantId: 'usr-tenant-02',
    kosId: 'kos-02',
    roomId: 'rm-02-01',
    tanggalMulai: new Date('2026-07-15'),
    durasiBulan: 12,
    totalHarga: 13200000,
    status: 'APPROVED',
    catatan: 'Mahasiswi Kedokteran, sewa 1 tahun.'
  },
  {
    id: 'bkg-03',
    tenantId: 'usr-tenant-01',
    kosId: 'kos-04',
    roomId: 'rm-04-01',
    tanggalMulai: new Date('2026-10-01'),
    durasiBulan: 3,
    totalHarga: 2550000,
    status: 'PENDING',
    catatan: 'Pengajuan sewa kamar 01 untuk adik tingkat.'
  }
];

export const seedFavorites = [
  {
    id: 'fav-01',
    userId: 'usr-tenant-01',
    kosId: 'kos-02',
    createdAt: new Date('2026-08-10')
  },
  {
    id: 'fav-02',
    userId: 'usr-tenant-01',
    kosId: 'kos-03',
    createdAt: new Date('2026-08-12')
  }
];

export const seedReviews = [
  {
    id: 'rev-01',
    tenantId: 'usr-tenant-01',
    kosId: 'kos-01',
    rating: 5,
    comment: 'Bapak Anton sangat ramah dan responsif. Lingkungan kos bersih, WiFi kencang buat ngerjain skripsi. Sangat direkomendasikan!',
    ownerReply: 'Terima kasih Mas Rian atas ulasannya. Semoga sukses untuk ujian skripsinya!',
    replyAt: new Date('2026-08-15')
  },
  {
    id: 'rev-02',
    tenantId: 'usr-tenant-02',
    kosId: 'kos-02',
    rating: 5,
    comment: 'Kos Melati nyaman sekali, kamar mandinya bersih dan AC dingin. Keamanan juga terjamin banget untuk perempuan.'
  }
];

