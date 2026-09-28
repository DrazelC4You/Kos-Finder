import crypto from 'crypto';
import prisma, { checkDatabaseConnection } from './prisma.js';
import { seedUsers, seedKos, seedBookings, seedReviews, seedFavorites } from '../../prisma/seedData.js';

/**
 * In-Memory Local Data Store (Fallback saat PostgreSQL server offline)
 * Diinisialisasi dengan data seed yang sama persis
 */
class MemoryDataStore {
  constructor() {
    this.users = JSON.parse(JSON.stringify(seedUsers));
    this.kos = JSON.parse(JSON.stringify(seedKos));
    this.bookings = JSON.parse(JSON.stringify(seedBookings));
    this.reviews = JSON.parse(JSON.stringify(seedReviews));
    this.favorites = JSON.parse(JSON.stringify(seedFavorites || []));
    this.conversations = [];
    this.messages = [];
    this.notifications = [];
    this.payments = [];
    this.agreements = [];
    this.invoices = [];
  }

  // ================= USER QUERIES =================
  async findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async findUserById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  async createUser(userData) {
    const newUser = {
      id: `usr-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      role: userData.role || 'TENANT',
      ...userData,
      profile: userData.profile || {}
    };
    this.users.push(newUser);
    return newUser;
  }

  // ================= KOS QUERIES =================
  async getAllKos(options = {}) {
    let result = [...this.kos];

    // 1. Filter Status (Default: ACTIVE untuk publik)
    if (options.status) {
      result = result.filter(k => k.status === options.status);
    }

    // 2. Filter Owner
    if (options.ownerId) {
      result = result.filter(k => k.ownerId === options.ownerId);
    }

    // 3. Filter Kata Kunci / Lokasi / Kota / Nama
    if (options.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(k =>
        k.nama.toLowerCase().includes(q) ||
        k.kota.toLowerCase().includes(q) ||
        k.alamat.toLowerCase().includes(q) ||
        (k.deskripsi && k.deskripsi.toLowerCase().includes(q))
      );
    } else if (options.kota) {
      result = result.filter(k => k.kota.toLowerCase().includes(options.kota.toLowerCase().trim()));
    }

    // 3b. Filter Berdasarkan Kampus / Landmark Nasional (Phase 13+)
    if (options.campus || options.landmark) {
      const target = (options.campus || options.landmark).toLowerCase().trim();
      const campusKeywordMap = {
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

      const keywords = campusKeywordMap[target] || [target];
      result = result.filter(k => {
        const textToSearch = `${k.nama} ${k.alamat} ${k.kota} ${k.deskripsi || ''}`.toLowerCase();
        return keywords.some(kw => textToSearch.includes(kw));
      });
    }

    // 4. Filter Tipe (CAMPUR, PUTRA, PUTRI)
    if (options.type) {
      result = result.filter(k => k.type === options.type.toUpperCase());
    }

    // 5. Filter Rentang Harga
    if (options.minPrice) {
      result = result.filter(k => Number(k.hargaBulanan) >= Number(options.minPrice));
    }
    if (options.maxPrice) {
      result = result.filter(k => Number(k.hargaBulanan) <= Number(options.maxPrice));
    }

    // 6. Filter Kamar Tersedia
    if (options.availableOnly) {
      result = result.filter(k => (k.kamarTersedia || 0) > 0);
    }

    // 6b. Filter Rating Minimal
    if (options.minRating) {
      result = result.filter(k => (k.rating || 0) >= Number(options.minRating));
    }

    // 7. Filter Fasilitas (harus memiliki semua fasilitas yang diminta)
    if (options.facilities && options.facilities.length > 0) {
      result = result.filter(k => {
        const facs = (k.fasilitas || []).map(f => f.toLowerCase());
        return options.facilities.every(f => {
          const targetFac = f.toLowerCase().trim();
          return facs.some(kFac => kFac.includes(targetFac) || targetFac.includes(kFac));
        });
      });
    }

    // 7b. Filter Aturan / Peraturan Kos (Phase 13)
    if (options.rules && options.rules.length > 0) {
      result = result.filter(k => {
        const aturanText = (k.aturan || '').toLowerCase();
        const facsText = (k.fasilitas || []).join(' ').toLowerCase();
        const combined = `${aturanText} ${facsText}`;
        return options.rules.every(r => {
          const ruleQuery = r.toLowerCase().trim();
          if (ruleQuery === '24jam' || ruleQuery === 'akses 24 jam') return combined.includes('24 jam') || combined.includes('bebas jam malam');
          if (ruleQuery === 'pasutri') return combined.includes('pasutri') || combined.includes('suami istri');
          if (ruleQuery === 'bebas_asap' || ruleQuery === 'dilarang merokok') return combined.includes('dilarang merokok') || combined.includes('bebas rokok');
          return combined.includes(ruleQuery);
        });
      });
    }

    // 8. Sorting
    if (options.sort === 'price-asc') {
      result.sort((a, b) => Number(a.hargaBulanan) - Number(b.hargaBulanan));
    } else if (options.sort === 'price-desc') {
      result.sort((a, b) => Number(b.hargaBulanan) - Number(a.hargaBulanan));
    } else if (options.sort === 'rating-desc') {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (options.sort === 'popular') {
      result.sort((a, b) => (b.jumlahReview || 0) - (a.jumlahReview || 0));
    } else {
      // newest default
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    // 9. Attach data owner
    result = result.map(k => {
      const owner = this.users.find(u => u.id === k.ownerId);
      return {
        ...k,
        owner: owner ? { id: owner.id, name: owner.name, phone: owner.phone, avatar: owner.avatar } : null
      };
    });

    const total = result.length;

    // 10. Pagination
    const page = Number(options.page) || 1;
    const limit = Number(options.limit) || 10;
    const startIndex = (page - 1) * limit;
    const paginatedData = result.slice(startIndex, startIndex + limit);

    return {
      data: paginatedData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async getKosById(id) {
    const kos = this.kos.find(k => k.id === id);
    if (!kos) return null;

    const owner = this.users.find(u => u.id === kos.ownerId);
    const reviews = this.reviews.filter(r => r.kosId === id).map(r => {
      const tenant = this.users.find(u => u.id === r.tenantId);
      return {
        ...r,
        tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
      };
    });

    return {
      ...kos,
      owner: owner ? { id: owner.id, name: owner.name, phone: owner.phone, avatar: owner.avatar } : null,
      reviews
    };
  }

  async createKos(kosData) {
    const totalRooms = Number(kosData.totalKamar) || 4;
    const rooms = [];
    for (let i = 1; i <= totalRooms; i++) {
      const pad = i < 10 ? `0${i}` : `${i}`;
      rooms.push({
        id: `rm-${Date.now()}-${pad}`,
        nomorKamar: `Kamar ${pad}`,
        harga: kosData.hargaBulanan,
        status: 'AVAILABLE'
      });
    }

    const newKos = {
      id: `kos-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      rating: 5.0,
      jumlahReview: 0,
      kamarTersedia: totalRooms,
      status: 'PENDING',
      isVerified: false,
      ...kosData,
      totalKamar: totalRooms,
      rooms
    };

    this.kos.unshift(newKos);
    return newKos;
  }

  async updateKos(id, updateData) {
    const index = this.kos.findIndex(k => k.id === id);
    if (index === -1) return null;

    const existing = this.kos[index];
    this.kos[index] = {
      ...existing,
      ...updateData,
      updatedAt: new Date()
    };
    return this.kos[index];
  }

  async deleteKos(id) {
    const index = this.kos.findIndex(k => k.id === id);
    if (index === -1) return false;
    this.kos.splice(index, 1);
    return true;
  }

  // ================= PROFILE & TENANT QUERIES =================
  async updateUserProfile(userId, updateData) {
    const index = this.users.findIndex(u => u.id === userId);
    if (index === -1) return null;
    const user = this.users[index];

    const { bio, gender, address, occupation, emergencyContact, ...mainFields } = updateData;

    this.users[index] = {
      ...user,
      ...mainFields,
      updatedAt: new Date(),
      profile: {
        ...(user.profile || {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(address !== undefined ? { address } : {}),
        ...(occupation !== undefined ? { occupation } : {}),
        ...(emergencyContact !== undefined ? { emergencyContact } : {})
      }
    };
    return this.users[index];
  }

  // ================= BOOKING QUERIES =================
  async getBookingsByTenantId(tenantId) {
    const list = this.bookings.filter(b => b.tenantId === tenantId);
    return list.map(b => {
      const kos = this.kos.find(k => k.id === b.kosId);
      const owner = kos ? this.users.find(u => u.id === kos.ownerId) : null;
      const room = kos?.rooms?.find(r => r.id === b.roomId) || null;
      return {
        ...b,
        kos: kos ? {
          id: kos.id,
          nama: kos.nama,
          alamat: kos.alamat,
          kota: kos.kota,
          type: kos.type,
          foto: kos.foto,
          hargaBulanan: kos.hargaBulanan,
          owner: owner ? { id: owner.id, name: owner.name, phone: owner.phone } : null
        } : null,
        room
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async createBooking(bookingData) {
    const kos = this.kos.find(k => k.id === bookingData.kosId);
    if (!kos) throw new Error('Kos tidak ditemukan.');

    const selectedRoomId = bookingData.roomId || kos.rooms?.[0]?.id || 'rm-default';

    // Cegah double-booking / booking kamar tidak tersedia (Section 18)
    if (Array.isArray(kos.rooms) && kos.rooms.length > 0) {
      const room = kos.rooms.find(r => r.id === selectedRoomId);
      if (!room) throw new Error('Kamar yang dipilih tidak ditemukan pada kos ini.');
      if (room.status !== 'AVAILABLE') throw new Error('Kamar ini sedang tidak tersedia. Silakan pilih kamar lain yang masih kosong.');
      const roomClash = this.bookings.find(b => b.roomId === room.id && ['PENDING', 'APPROVED'].includes(b.status));
      if (roomClash) throw new Error('Kamar ini sudah memiliki pengajuan sewa yang aktif. Silakan pilih kamar lain.');
    }

    const tenantClash = this.bookings.find(
      b => b.tenantId === bookingData.tenantId && b.kosId === bookingData.kosId && ['PENDING', 'APPROVED'].includes(b.status)
    );
    if (tenantClash) throw new Error('Anda sudah memiliki pengajuan sewa aktif untuk kos ini.');

    const newBooking = {
      id: `bkg-${Date.now()}`,
      tenantId: bookingData.tenantId,
      kosId: bookingData.kosId,
      roomId: selectedRoomId,
      tanggalMulai: new Date(bookingData.tanggalMulai || Date.now()),
      durasiBulan: Number(bookingData.durasiBulan) || 1,
      totalHarga: Number(bookingData.totalHarga) || (Number(kos.hargaBulanan) * (Number(bookingData.durasiBulan) || 1)),
      status: 'PENDING',
      catatan: bookingData.catatan || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bookings.unshift(newBooking);

    // Kirim notifikasi otomatis ke Pemilik Kos
    const tenant = this.users.find(u => u.id === bookingData.tenantId);
    this.createNotification({
      userId: kos.ownerId,
      title: 'Pengajuan Sewa Baru Masuk! 📋',
      message: `${tenant?.name || 'Calon penyewa'} mengajukan sewa untuk kos "${kos.nama}" (${newBooking.durasiBulan} bulan). Silakan tinjau di Dashboard.`,
      type: 'BOOKING_NEW',
      link: '/owner/dashboard?tab=booking'
    });

    const owner = this.users.find(u => u.id === kos.ownerId);
    const room = kos.rooms?.find(r => r.id === newBooking.roomId) || null;

    return {
      ...newBooking,
      kos: {
        id: kos.id,
        nama: kos.nama,
        alamat: kos.alamat,
        kota: kos.kota,
        type: kos.type,
        foto: kos.foto,
        hargaBulanan: kos.hargaBulanan,
        owner: owner ? { id: owner.id, name: owner.name, phone: owner.phone } : null
      },
      room
    };
  }

  async cancelBooking(bookingId, tenantId) {
    const booking = this.bookings.find(b => b.id === bookingId && b.tenantId === tenantId);
    if (!booking) {
      throw new Error('Booking tidak ditemukan atau Anda tidak memiliki akses.');
    }
    if (booking.status !== 'PENDING') {
      throw new Error('Hanya booking dengan status Menunggu Konfirmasi (PENDING) yang dapat dibatalkan.');
    }
    booking.status = 'CANCELLED';
    booking.updatedAt = new Date();
    return booking;
  }

  // ================= ROOM AVAILABILITY & RENTAL EXTENSION (PHASE 14) =================
  async requestBookingExtension(bookingId, tenantId, durasiBulan, catatan) {
    const booking = this.bookings.find(b => b.id === bookingId && b.tenantId === tenantId);
    if (!booking) throw new Error('Data booking sewa tidak ditemukan.');
    if (booking.status !== 'APPROVED' && booking.status !== 'COMPLETED') {
      throw new Error('Hanya masa sewa yang aktif atau lunas yang dapat diperpanjang.');
    }

    const kos = this.kos.find(k => k.id === booking.kosId);
    const room = kos?.rooms?.find(r => r.id === booking.roomId);
    const pricePerMonth = Number(room?.harga || kos?.hargaBulanan || 0);
    const biayaPerpanjangan = pricePerMonth * Number(durasiBulan);

    booking.extensionRequest = {
      id: `ext-${Date.now()}`,
      durasiBulan: Number(durasiBulan),
      biayaPerpanjangan,
      catatan: catatan || '',
      status: 'PENDING',
      createdAt: new Date()
    };
    booking.updatedAt = new Date();

    // Notifikasi ke Pemilik Kos
    const tenant = this.users.find(u => u.id === tenantId);
    this.createNotification({
      userId: kos.ownerId,
      title: 'Permintaan Perpanjangan Sewa! 🔄',
      message: `${tenant?.name || 'Penyewa'} mengajukan perpanjangan masa sewa untuk kos "${kos.nama}" (${durasiBulan} bulan). Silakan tinjau di Dashboard.`,
      type: 'BOOKING_EXTENSION',
      link: '/owner/dashboard?tab=booking'
    });

    return booking;
  }

  async processExtensionApproval(bookingId, ownerId, action, alasanPenolakan) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Data booking tidak ditemukan.');

    const kos = this.kos.find(k => k.id === booking.kosId);
    if (!kos || kos.ownerId !== ownerId) {
      throw new Error('Anda tidak memiliki akses sebagai pemilik kos ini.');
    }

    if (!booking.extensionRequest || booking.extensionRequest.status !== 'PENDING') {
      throw new Error('Tidak ada permintaan perpanjangan sewa yang sedang menunggu konfirmasi.');
    }

    if (action === 'approve') {
      booking.durasiBulan += Number(booking.extensionRequest.durasiBulan);
      booking.totalHarga += Number(booking.extensionRequest.biayaPerpanjangan);
      booking.extensionRequest.status = 'APPROVED';
      booking.extensionRequest.updatedAt = new Date();
      booking.updatedAt = new Date();

      // Notifikasi ke Penyewa
      this.createNotification({
        userId: booking.tenantId,
        title: 'Perpanjangan Sewa Disetujui! 🎉',
        message: `Pemilik kos "${kos.nama}" telah menyetujui perpanjangan sewa Anda selama ${booking.extensionRequest.durasiBulan} bulan.`,
        type: 'EXTENSION_APPROVED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    } else {
      booking.extensionRequest.status = 'REJECTED';
      booking.extensionRequest.alasanPenolakan = alasanPenolakan || 'Ditolak oleh pemilik kos.';
      booking.extensionRequest.updatedAt = new Date();
      booking.updatedAt = new Date();

      // Notifikasi ke Penyewa
      this.createNotification({
        userId: booking.tenantId,
        title: 'Pengajuan Perpanjangan Ditolak ⚠️',
        message: `Pengajuan perpanjangan sewa untuk kos "${kos.nama}" ditolak: ${booking.extensionRequest.alasanPenolakan}`,
        type: 'EXTENSION_REJECTED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    }

    return booking;
  }

  async getRoomAvailabilitySchedule(kosId) {
    const kos = this.kos.find(k => k.id === kosId);
    if (!kos) throw new Error('Kos tidak ditemukan.');

    const rooms = kos.rooms || [];
    const now = new Date();

    const schedule = rooms.map(room => {
      const activeBooking = this.bookings.find(b =>
        b.kosId === kosId &&
        b.roomId === room.id &&
        (b.status === 'APPROVED' || b.status === 'COMPLETED')
      );

      let tanggalSelesai = null;
      let daysRemaining = null;
      let isAvailableNow = room.status === 'AVAILABLE';

      if (activeBooking) {
        const start = new Date(activeBooking.tanggalMulai);
        const end = new Date(start);
        end.setMonth(end.getMonth() + Number(activeBooking.durasiBulan));
        tanggalSelesai = end;
        const diffMs = end.getTime() - now.getTime();
        daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (daysRemaining <= 0) {
          isAvailableNow = true;
        }
      }

      return {
        roomId: room.id,
        nomorKamar: room.nomorKamar,
        harga: room.harga || kos.hargaBulanan,
        status: isAvailableNow ? 'AVAILABLE' : room.status,
        isAvailableNow,
        tanggalMulaiSewa: activeBooking ? activeBooking.tanggalMulai : null,
        tanggalSelesaiSewa: tanggalSelesai,
        daysRemaining,
        tenant: activeBooking ? (() => {
          const u = this.users.find(x => x.id === activeBooking.tenantId);
          return u ? { name: u.name, phone: u.phone } : null;
        })() : null,
        availableFromText: isAvailableNow ? 'Tersedia Sekarang' : `Tersedia pada ${tanggalSelesai?.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
      };
    });

    return {
      kosId: kos.id,
      namaKos: kos.nama,
      totalKamar: rooms.length,
      kamarTersediaSekarang: schedule.filter(r => r.isAvailableNow).length,
      rooms: schedule
    };
  }

  async getExpiringRentals(userId, role) {
    const now = new Date();
    let targetBookings = [];
    if (role === 'TENANT') {
      targetBookings = this.bookings.filter(b => b.tenantId === userId && (b.status === 'APPROVED' || b.status === 'COMPLETED'));
    } else {
      const ownerKosIds = this.kos.filter(k => k.ownerId === userId).map(k => k.id);
      targetBookings = this.bookings.filter(b => ownerKosIds.includes(b.kosId) && (b.status === 'APPROVED' || b.status === 'COMPLETED'));
    }

    const expiring = [];
    targetBookings.forEach(b => {
      const start = new Date(b.tanggalMulai);
      const end = new Date(start);
      end.setMonth(end.getMonth() + Number(b.durasiBulan));
      const diffMs = end.getTime() - now.getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (daysRemaining <= 30) {
        const kos = this.kos.find(k => k.id === b.kosId);
        const tenant = this.users.find(u => u.id === b.tenantId);
        const room = kos?.rooms?.find(r => r.id === b.roomId);
        expiring.push({
          bookingId: b.id,
          kosNama: kos?.nama,
          nomorKamar: room?.nomorKamar || 'Kamar Utama',
          tenantNama: tenant?.name,
          tanggalSelesai: end,
          daysRemaining,
          isExpiringSoon: daysRemaining <= 7,
          extensionRequest: b.extensionRequest || null
        });
      }
    });

    return expiring.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  // ================= FAVORITE QUERIES =================
  async getFavoritesByUserId(userId) {
    const userFavorites = this.favorites.filter(f => f.userId === userId);
    return userFavorites.map(f => {
      const kos = this.kos.find(k => k.id === f.kosId);
      const owner = kos ? this.users.find(u => u.id === kos.ownerId) : null;
      return {
        ...f,
        kos: kos ? {
          ...kos,
          owner: owner ? { id: owner.id, name: owner.name, phone: owner.phone, avatar: owner.avatar } : null
        } : null
      };
    }).filter(f => f.kos !== null);
  }

  async addFavorite(userId, kosId) {
    const existing = this.favorites.find(f => f.userId === userId && f.kosId === kosId);
    if (existing) return existing;

    const newFav = {
      id: `fav-${Date.now()}`,
      userId,
      kosId,
      createdAt: new Date()
    };
    this.favorites.push(newFav);
    return newFav;
  }

  async removeFavorite(userId, kosId) {
    const idx = this.favorites.findIndex(f => f.userId === userId && f.kosId === kosId);
    if (idx !== -1) {
      this.favorites.splice(idx, 1);
      return true;
    }
    return false;
  }

  // ================= TENANT METRICS =================
  async getTenantDashboardStats(tenantId) {
    const tenantBookings = this.bookings.filter(b => b.tenantId === tenantId);
    const tenantFavorites = this.favorites.filter(f => f.userId === tenantId);

    return {
      totalBookings: tenantBookings.length,
      activeBookings: tenantBookings.filter(b => b.status === 'APPROVED').length,
      pendingBookings: tenantBookings.filter(b => b.status === 'PENDING').length,
      rejectedBookings: tenantBookings.filter(b => b.status === 'REJECTED').length,
      cancelledBookings: tenantBookings.filter(b => b.status === 'CANCELLED').length,
      totalFavorites: tenantFavorites.length
    };
  }

  // ================= OWNER METHODS =================
  async getOwnerDashboardStats(ownerId) {
    const ownerKos = this.kos.filter(k => k.ownerId === ownerId);
    const kosIds = ownerKos.map(k => k.id);
    
    let totalRooms = 0;
    let availableRooms = 0;
    let occupiedRooms = 0;
    let estimatedRevenue = 0;

    ownerKos.forEach(k => {
      const rooms = k.rooms || [];
      totalRooms += rooms.length;
      rooms.forEach(r => {
        if (r.status === 'AVAILABLE') availableRooms++;
        if (r.status === 'OCCUPIED') {
          occupiedRooms++;
          estimatedRevenue += Number(r.harga || k.hargaBulanan || 0);
        }
      });
    });

    const ownerBookings = this.bookings.filter(b => kosIds.includes(b.kosId));
    const pendingBookings = ownerBookings.filter(b => b.status === 'PENDING').length;
    const approvedBookings = ownerBookings.filter(b => b.status === 'APPROVED').length;

    return {
      totalProperties: ownerKos.length,
      totalRooms,
      availableRooms,
      occupiedRooms,
      pendingBookings,
      approvedBookings,
      estimatedMonthlyRevenue: estimatedRevenue
    };
  }

  async getKosByOwnerId(ownerId) {
    const list = this.kos.filter(k => k.ownerId === ownerId);
    return list.map(k => {
      const bookingsCount = this.bookings.filter(b => b.kosId === k.id).length;
      const pendingCount = this.bookings.filter(b => b.kosId === k.id && b.status === 'PENDING').length;
      return {
        ...k,
        bookingsCount,
        pendingBookingsCount: pendingCount
      };
    });
  }

  async addRoomToKos(kosId, ownerId, roomData) {
    const kos = this.kos.find(k => k.id === kosId && k.ownerId === ownerId);
    if (!kos) throw new Error('Kos tidak ditemukan atau Anda tidak memiliki akses.');

    if (!kos.rooms) kos.rooms = [];
    const newRoom = {
      id: `rm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nomorKamar: roomData.nomorKamar || `Kamar ${kos.rooms.length + 1}`,
      harga: Number(roomData.harga) || Number(kos.hargaBulanan),
      status: roomData.status || 'AVAILABLE'
    };

    kos.rooms.push(newRoom);
    kos.totalKamar = kos.rooms.length;
    kos.kamarTersedia = kos.rooms.filter(r => r.status === 'AVAILABLE').length;
    kos.updatedAt = new Date();

    return newRoom;
  }

  async updateRoom(roomId, ownerId, roomData) {
    let targetKos = null;
    let targetRoom = null;

    for (const k of this.kos) {
      if (k.rooms) {
        const r = k.rooms.find(rm => rm.id === roomId);
        if (r) {
          targetKos = k;
          targetRoom = r;
          break;
        }
      }
    }

    if (!targetKos || targetKos.ownerId !== ownerId || !targetRoom) {
      throw new Error('Kamar tidak ditemukan atau Anda tidak memiliki akses.');
    }

    if (roomData.nomorKamar !== undefined) targetRoom.nomorKamar = roomData.nomorKamar;
    if (roomData.harga !== undefined) targetRoom.harga = Number(roomData.harga);
    if (roomData.status !== undefined) targetRoom.status = roomData.status;

    targetKos.kamarTersedia = targetKos.rooms.filter(r => r.status === 'AVAILABLE').length;
    targetKos.updatedAt = new Date();

    return targetRoom;
  }

  async deleteRoom(roomId, ownerId) {
    let targetKos = null;
    let roomIndex = -1;

    for (const k of this.kos) {
      if (k.rooms) {
        const idx = k.rooms.findIndex(rm => rm.id === roomId);
        if (idx !== -1) {
          targetKos = k;
          roomIndex = idx;
          break;
        }
      }
    }

    if (!targetKos || targetKos.ownerId !== ownerId || roomIndex === -1) {
      throw new Error('Kamar tidak ditemukan atau Anda tidak memiliki akses.');
    }

    targetKos.rooms.splice(roomIndex, 1);
    targetKos.totalKamar = targetKos.rooms.length;
    targetKos.kamarTersedia = targetKos.rooms.filter(r => r.status === 'AVAILABLE').length;
    targetKos.updatedAt = new Date();

    return true;
  }

  async getBookingsByOwnerId(ownerId) {
    const ownerKos = this.kos.filter(k => k.ownerId === ownerId);
    const kosIds = ownerKos.map(k => k.id);
    const bookings = this.bookings.filter(b => kosIds.includes(b.kosId));

    return bookings.map(b => {
      const kos = ownerKos.find(k => k.id === b.kosId);
      const room = kos?.rooms?.find(r => r.id === b.roomId) || null;
      const tenant = this.users.find(u => u.id === b.tenantId);

      return {
        ...b,
        kos: kos ? { id: kos.id, nama: kos.nama, alamat: kos.alamat, kota: kos.kota, type: kos.type, foto: kos.foto } : null,
        room,
        tenant: tenant ? { id: tenant.id, name: tenant.name, email: tenant.email, phone: tenant.phone, avatar: tenant.avatar } : null
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  async updateBookingStatusByOwner(bookingId, ownerId, status) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan.');

    const kos = this.kos.find(k => k.id === booking.kosId && k.ownerId === ownerId);
    if (!kos) throw new Error('Anda tidak memiliki otoritas atas kos ini.');

    booking.status = status;
    booking.updatedAt = new Date();

    // Jika disetujui, update kamar menjadi OCCUPIED
    if (status === 'APPROVED' && booking.roomId && kos.rooms) {
      const room = kos.rooms.find(r => r.id === booking.roomId);
      if (room) room.status = 'OCCUPIED';
      kos.kamarTersedia = kos.rooms.filter(r => r.status === 'AVAILABLE').length;

      // Kirim Notifikasi Disetujui ke Penyewa
      this.createNotification({
        userId: booking.tenantId,
        title: 'Pengajuan Sewa Disetujui! 🎉',
        message: `Selamat! Pengajuan sewa Anda untuk kos "${kos.nama}" telah disetujui oleh pemilik. Silakan cek detail di dashboard Anda.`,
        type: 'BOOKING_APPROVED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    } else if ((status === 'REJECTED' || status === 'CANCELLED') && booking.roomId && kos.rooms) {
      const room = kos.rooms.find(r => r.id === booking.roomId);
      if (room && room.status === 'OCCUPIED') room.status = 'AVAILABLE';
      kos.kamarTersedia = kos.rooms.filter(r => r.status === 'AVAILABLE').length;

      if (status === 'REJECTED') {
        // Kirim Notifikasi Ditolak ke Penyewa
        this.createNotification({
          userId: booking.tenantId,
          title: 'Update Pengajuan Sewa Kos',
          message: `Mohon maaf, pengajuan sewa Anda untuk kos "${kos.nama}" belum dapat disetujui oleh pemilik saat ini.`,
          type: 'BOOKING_REJECTED',
          link: '/tenant/dashboard?tab=riwayat'
        });
      }
    }

    return booking;
  }

  // ================= REVIEW METHODS =================
  async getReviewsByKosId(kosId) {
    const reviews = this.reviews.filter(r => r.kosId === kosId);
    const mapped = reviews.map(r => {
      const tenant = this.users.find(u => u.id === r.tenantId);
      return {
        ...r,
        tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = mapped.length;
    const averageRating = total > 0 ? Number((mapped.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)) : 0;
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    mapped.forEach(r => {
      if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
    });

    return {
      reviews: mapped,
      totalReviews: total,
      averageRating,
      breakdown
    };
  }

  async createReview({ tenantId, kosId, rating, comment }) {
    const kos = this.kos.find(k => k.id === kosId);
    if (!kos) throw new Error('Kos tidak ditemukan.');

    const existingIndex = this.reviews.findIndex(r => r.tenantId === tenantId && r.kosId === kosId);
    if (existingIndex !== -1) {
      // Update existing review
      this.reviews[existingIndex].rating = Number(rating);
      this.reviews[existingIndex].comment = comment.trim();
      this.reviews[existingIndex].updatedAt = new Date();
      this._recalculateKosRating(kosId);
      const tenant = this.users.find(u => u.id === tenantId);
      return {
        ...this.reviews[existingIndex],
        tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
      };
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      tenantId,
      kosId,
      rating: Number(rating),
      comment: comment.trim(),
      ownerReply: null,
      replyAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.reviews.unshift(newReview);
    this._recalculateKosRating(kosId);

    // Kirim notifikasi ulasan baru ke pemilik kos
    const tenant = this.users.find(u => u.id === tenantId);
    this.createNotification({
      userId: kos.ownerId,
      title: `Ulasan Baru Masuk (${newReview.rating} ⭐)`,
      message: `${tenant?.name || 'Penghuni'} memberikan rating ${newReview.rating} bintang untuk "${kos.nama}": "${newReview.comment.substring(0, 60)}..."`,
      type: 'REVIEW_NEW',
      link: '/owner/dashboard?tab=ulasan'
    });

    return {
      ...newReview,
      tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
    };
  }

  async updateReview(reviewId, tenantId, { rating, comment }) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Ulasan tidak ditemukan.');
    if (review.tenantId !== tenantId) throw new Error('Anda tidak memiliki izin mengedit ulasan ini.');

    if (rating) review.rating = Number(rating);
    if (comment) review.comment = comment.trim();
    review.updatedAt = new Date();

    this._recalculateKosRating(review.kosId);
    const tenant = this.users.find(u => u.id === tenantId);
    return {
      ...review,
      tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
    };
  }

  async deleteReview(reviewId, userId, userRole) {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) throw new Error('Ulasan tidak ditemukan.');
    const review = this.reviews[index];
    if (review.tenantId !== userId && userRole !== 'ADMIN') {
      throw new Error('Anda tidak memiliki hak menghapus ulasan ini.');
    }

    const kosId = review.kosId;
    this.reviews.splice(index, 1);
    this._recalculateKosRating(kosId);
    return true;
  }

  async replyReviewByOwner(reviewId, ownerId, replyComment) {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) throw new Error('Ulasan tidak ditemukan.');

    const kos = this.kos.find(k => k.id === review.kosId && k.ownerId === ownerId);
    if (!kos) throw new Error('Anda bukan pemilik properti kos dari ulasan ini.');

    review.ownerReply = replyComment.trim();
    review.replyAt = new Date();
    review.updatedAt = new Date();

    const tenant = this.users.find(u => u.id === review.tenantId);
    return {
      ...review,
      tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
    };
  }

  async getReviewsByOwnerId(ownerId) {
    const ownerKos = this.kos.filter(k => k.ownerId === ownerId);
    const kosIds = ownerKos.map(k => k.id);
    const reviews = this.reviews.filter(r => kosIds.includes(r.kosId));

    return reviews.map(r => {
      const kos = ownerKos.find(k => k.id === r.kosId);
      const tenant = this.users.find(u => u.id === r.tenantId);
      return {
        ...r,
        kos: kos ? { id: kos.id, nama: kos.nama } : null,
        tenant: tenant ? { id: tenant.id, name: tenant.name, avatar: tenant.avatar } : null
      };
    }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }

  _recalculateKosRating(kosId) {
    const kos = this.kos.find(k => k.id === kosId);
    if (!kos) return;
    const kosReviews = this.reviews.filter(r => r.kosId === kosId);
    const total = kosReviews.length;
    if (total === 0) {
      kos.rating = 0;
      kos.jumlahReview = 0;
    } else {
      const avg = (kosReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1);
      kos.rating = Number(avg);
      kos.jumlahReview = total;
    }
  }

  // ================= CHAT / CONVERSATION METHODS =================
  async getOrCreateConversation({ tenantId, ownerId, kosId }) {
    let conv = this.conversations.find(c => 
      c.tenantId === tenantId && c.ownerId === ownerId && c.kosId === kosId
    );

    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        tenantId,
        ownerId,
        kosId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.conversations.unshift(conv);
    }

    return this.getConversationDetails(conv.id, tenantId);
  }

  async getUserConversations(userId) {
    const userConvs = this.conversations.filter(c => c.tenantId === userId || c.ownerId === userId);

    return userConvs.map(c => {
      const isTenant = c.tenantId === userId;
      const partnerId = isTenant ? c.ownerId : c.tenantId;
      const partner = this.users.find(u => u.id === partnerId);
      const kos = this.kos.find(k => k.id === c.kosId);

      const convMessages = this.messages.filter(m => m.conversationId === c.id);
      const lastMessage = convMessages.length > 0 ? convMessages[convMessages.length - 1] : null;
      const unreadCount = convMessages.filter(m => m.senderId !== userId && !m.isRead).length;

      return {
        id: c.id,
        partner: partner ? { id: partner.id, name: partner.name, avatar: partner.avatar, role: partner.role } : null,
        kos: kos ? { id: kos.id, nama: kos.nama, foto: kos.foto?.[0] || null, kota: kos.kota } : null,
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          message: lastMessage.message,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        unreadCount,
        updatedAt: c.updatedAt
      };
    }).sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  }

  async getConversationDetails(conversationId, userId) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Percakapan tidak ditemukan.');

    if (conv.tenantId !== userId && conv.ownerId !== userId) {
      throw new Error('Anda tidak memiliki akses ke percakapan ini.');
    }

    const isTenant = conv.tenantId === userId;
    const partnerId = isTenant ? conv.ownerId : conv.tenantId;
    const partner = this.users.find(u => u.id === partnerId);
    const kos = this.kos.find(k => k.id === conv.kosId);

    // Mark messages as read
    this.messages.forEach(m => {
      if (m.conversationId === conversationId && m.senderId !== userId) {
        m.isRead = true;
      }
    });

    const messages = this.messages
      .filter(m => m.conversationId === conversationId)
      .map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        message: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt
      }))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return {
      id: conv.id,
      partner: partner ? { id: partner.id, name: partner.name, avatar: partner.avatar, role: partner.role, phone: partner.phone } : null,
      kos: kos ? { id: kos.id, nama: kos.nama, foto: kos.foto?.[0] || null, hargaBulanan: kos.hargaBulanan, kota: kos.kota } : null,
      messages
    };
  }

  async sendMessage({ conversationId, senderId, message }) {
    const conv = this.conversations.find(c => c.id === conversationId);
    if (!conv) throw new Error('Percakapan tidak ditemukan.');

    if (conv.tenantId !== senderId && conv.ownerId !== senderId) {
      throw new Error('Anda tidak memiliki izin mengirim pesan di percakapan ini.');
    }

    const newMessage = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderId,
      message: message.trim(),
      isRead: false,
      createdAt: new Date()
    };

    this.messages.push(newMessage);
    conv.updatedAt = new Date();

    const sender = this.users.find(u => u.id === senderId);
    const receiverId = conv.tenantId === senderId ? conv.ownerId : conv.tenantId;

    // Buat notifikasi pesan baru untuk penerima
    this.createNotification({
      userId: receiverId,
      title: `Pesan Baru dari ${sender?.name || 'Pengguna'} 💬`,
      message: message.length > 80 ? `${message.substring(0, 80)}...` : message,
      type: 'MESSAGE_NEW',
      link: `/chat?id=${conversationId}`
    });

    return {
      ...newMessage,
      sender: sender ? { id: sender.id, name: sender.name, avatar: sender.avatar } : null
    };
  }

  async getUnreadChatCount(userId) {
    const userConvs = this.conversations.filter(c => c.tenantId === userId || c.ownerId === userId);
    const convIds = userConvs.map(c => c.id);
    return this.messages.filter(m => convIds.includes(m.conversationId) && m.senderId !== userId && !m.isRead).length;
  }

  // ================= NOTIFICATION METHODS =================
  async createNotification({ userId, title, message, type = 'SYSTEM_INFO', link = null }) {
    const notif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      title,
      message,
      type,
      isRead: false,
      link,
      createdAt: new Date()
    };
    this.notifications.unshift(notif);
    return notif;
  }

  async getUserNotifications(userId) {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getUnreadNotificationCount(userId) {
    return this.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async markNotificationAsRead(notificationId, userId) {
    const notif = this.notifications.find(n => n.id === notificationId && n.userId === userId);
    if (!notif) throw new Error('Notifikasi tidak ditemukan.');
    notif.isRead = true;
    return notif;
  }

  async markAllNotificationsAsRead(userId) {
    this.notifications.forEach(n => {
      if (n.userId === userId) {
        n.isRead = true;
      }
    });
    return true;
  }

  async deleteNotification(notificationId, userId) {
    const idx = this.notifications.findIndex(n => n.id === notificationId && n.userId === userId);
    if (idx === -1) throw new Error('Notifikasi tidak ditemukan.');
    this.notifications.splice(idx, 1);
    return true;
  }

  // ================= ADMIN METHODS =================

  async getAdminStats() {
    const totalUsers = this.users.length;
    const totalKos = this.kos.length;
    const totalBookings = this.bookings.length;
    const totalReviews = this.reviews.length;
    const totalReports = (this.reports || []).length;

    const activeKos = this.kos.filter(k => k.status === 'ACTIVE').length;
    const pendingKos = this.kos.filter(k => k.status === 'PENDING').length;
    const verifiedKos = this.kos.filter(k => k.isVerified === true).length;

    const tenantCount = this.users.filter(u => u.role === 'TENANT').length;
    const ownerCount = this.users.filter(u => u.role === 'OWNER').length;
    const adminCount = this.users.filter(u => u.role === 'ADMIN').length;

    const approvedBookings = this.bookings.filter(b => b.status === 'APPROVED').length;
    const pendingBookings = this.bookings.filter(b => b.status === 'PENDING').length;

    const totalRevenue = this.bookings
      .filter(b => b.status === 'APPROVED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.totalHarga), 0);

    const pendingReports = (this.reports || []).filter(r => r.status === 'PENDING').length;

    return {
      users: { total: totalUsers, tenants: tenantCount, owners: ownerCount, admins: adminCount },
      kos: { total: totalKos, active: activeKos, pending: pendingKos, verified: verifiedKos },
      bookings: { total: totalBookings, approved: approvedBookings, pending: pendingBookings },
      reviews: { total: totalReviews },
      reports: { total: totalReports, pending: pendingReports },
      revenue: { total: totalRevenue }
    };
  }

  async adminGetAllUsers({ role, search, page = 1, limit = 20 } = {}) {
    let result = this.users.map(u => {
      const { password, ...safe } = u;
      return safe;
    });

    if (role) result = result.filter(u => u.role === role.toUpperCase());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const data = result.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async adminUpdateUserRole(userId, newRole) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    user.role = newRole;
    user.updatedAt = new Date();
    const { password, ...safe } = user;
    return safe;
  }

  async adminToggleUserStatus(userId, isVerified) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    user.isVerified = isVerified;
    user.updatedAt = new Date();
    const { password, ...safe } = user;
    return safe;
  }

  async adminGetAllListings({ status, search, page = 1, limit = 20 } = {}) {
    let result = this.kos.map(k => {
      const owner = this.users.find(u => u.id === k.ownerId);
      return {
        ...k,
        owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null
      };
    });

    if (status) result = result.filter(k => k.status === status.toUpperCase());
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(k =>
        k.nama?.toLowerCase().includes(q) ||
        k.kota?.toLowerCase().includes(q) ||
        k.alamat?.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const data = result.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async adminUpdateListingStatus(kosId, { status, isVerified }) {
    const kos = this.kos.find(k => k.id === kosId);
    if (!kos) return null;
    kos.status = status;
    kos.isVerified = isVerified;
    kos.updatedAt = new Date();
    return kos;
  }

  async adminGetAllReports({ status, page = 1, limit = 20 } = {}) {
    if (!this.reports) this.reports = [];
    let result = (this.reports || []).map(r => {
      const reporter = this.users.find(u => u.id === r.reporterId);
      const kos = this.kos.find(k => k.id === r.kosId);
      return {
        ...r,
        reporter: reporter ? { id: reporter.id, name: reporter.name, email: reporter.email } : null,
        kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota } : null
      };
    });

    if (status) result = result.filter(r => r.status === status.toUpperCase());
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const data = result.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async adminCreateReport({ reporterId, kosId, reason }) {
    if (!this.reports) this.reports = [];
    const report = {
      id: `rpt-${Date.now()}`,
      reporterId,
      kosId,
      reason,
      status: 'PENDING',
      createdAt: new Date()
    };
    this.reports.push(report);
    return report;
  }

  async adminUpdateReportStatus(reportId, newStatus) {
    if (!this.reports) this.reports = [];
    const report = this.reports.find(r => r.id === reportId);
    if (!report) return null;
    report.status = newStatus;
    return report;
  }

  async adminGetAllReviews({ page = 1, limit = 20 } = {}) {
    let result = this.reviews.map(r => {
      const tenant = this.users.find(u => u.id === r.tenantId);
      const kos = this.kos.find(k => k.id === r.kosId);
      return {
        ...r,
        tenant: tenant ? { id: tenant.id, name: tenant.name } : null,
        kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota } : null
      };
    });

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const total = result.length;
    const startIndex = (page - 1) * limit;
    const data = result.slice(startIndex, startIndex + limit);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  async adminDeleteReview(reviewId) {
    const idx = this.reviews.findIndex(r => r.id === reviewId);
    if (idx === -1) return null;
    const [deleted] = this.reviews.splice(idx, 1);
    if (deleted?.kosId) await this._recalculateKosRating(deleted.kosId);
    return deleted;
  }

  // ================= PAYMENT METHODS =================

  async createPayment({ bookingId, tenantId, metodePembayaran, namaRekening, nomorRekening, jumlahTransfer, catatan }) {
    // Validasi booking
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan');
    if (booking.tenantId !== tenantId) throw new Error('Anda tidak memiliki akses ke booking ini');
    if (!['PENDING', 'APPROVED'].includes(booking.status)) {
      throw new Error('Pembayaran hanya bisa dikirim untuk booking yang masih aktif');
    }

    // Cek sudah ada pembayaran pending/confirmed
    const existing = this.payments.find(p => p.bookingId === bookingId && p.status === 'PENDING');
    if (existing) throw new Error('Sudah ada bukti pembayaran yang sedang menunggu konfirmasi');

    const kos = this.kos.find(k => k.id === booking.kosId);
    const payment = {
      id: `pay-${Date.now()}`,
      bookingId,
      tenantId,
      ownerId: kos?.ownerId || '',
      kosId: booking.kosId,
      metodePembayaran,
      namaRekening,
      nomorRekening,
      jumlahTransfer,
      catatan,
      status: 'PENDING', // PENDING | CONFIRMED | REJECTED
      alasanPenolakan: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.payments.push(payment);

    // Notifikasi ke owner
    const tenant = this.users.find(u => u.id === tenantId);
    if (kos?.ownerId) {
      this.createNotification({
        userId: kos.ownerId,
        title: '💰 Bukti Pembayaran Masuk',
        message: `${tenant?.name || 'Penyewa'} mengirim bukti transfer Rp${jumlahTransfer.toLocaleString('id-ID')} untuk kos "${kos?.nama}". Silakan konfirmasi.`,
        type: 'BOOKING_NEW',
        link: '/owner/dashboard?tab=pembayaran'
      });
    }

    return { ...payment, booking, kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota } : null };
  }

  async getPaymentByBookingId(bookingId, userId) {
    const payment = this.payments.find(p => p.bookingId === bookingId);
    if (!payment) return null;

    const booking = this.bookings.find(b => b.id === bookingId);
    // Pastikan user adalah tenant atau owner dari kos ini
    const kos = this.kos.find(k => k.id === payment.kosId);
    if (payment.tenantId !== userId && kos?.ownerId !== userId) return null;

    const tenant = this.users.find(u => u.id === payment.tenantId);
    return {
      ...payment,
      booking: booking || null,
      tenant: tenant ? { id: tenant.id, name: tenant.name, phone: tenant.phone } : null,
      kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota } : null
    };
  }

  async getPaymentsByTenantId(tenantId) {
    return this.payments
      .filter(p => p.tenantId === tenantId)
      .map(p => {
        const kos = this.kos.find(k => k.id === p.kosId);
        const booking = this.bookings.find(b => b.id === p.bookingId);
        return {
          ...p,
          kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota, foto: kos.foto } : null,
          booking: booking ? { id: booking.id, tanggalMulai: booking.tanggalMulai, durasiBulan: booking.durasiBulan, totalHarga: booking.totalHarga } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getPaymentsByOwnerId(ownerId) {
    return this.payments
      .filter(p => p.ownerId === ownerId)
      .map(p => {
        const kos = this.kos.find(k => k.id === p.kosId);
        const booking = this.bookings.find(b => b.id === p.bookingId);
        const tenant = this.users.find(u => u.id === p.tenantId);
        return {
          ...p,
          kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota, foto: kos.foto } : null,
          booking: booking ? { id: booking.id, tanggalMulai: booking.tanggalMulai, durasiBulan: booking.durasiBulan, totalHarga: booking.totalHarga } : null,
          tenant: tenant ? { id: tenant.id, name: tenant.name, phone: tenant.phone, avatar: tenant.avatar } : null
        };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async processPaymentConfirmation(paymentId, ownerId, action, alasanPenolakan) {
    const payment = this.payments.find(p => p.id === paymentId);
    if (!payment) return null;
    if (payment.ownerId !== ownerId) return null;
    if (payment.status !== 'PENDING') throw new Error('Pembayaran sudah diproses sebelumnya');

    const booking = this.bookings.find(b => b.id === payment.bookingId);
    const kos = this.kos.find(k => k.id === payment.kosId);
    const tenant = this.users.find(u => u.id === payment.tenantId);

    if (action === 'confirm') {
      payment.status = 'CONFIRMED';
      payment.updatedAt = new Date();
      // Update booking status jadi COMPLETED
      if (booking) {
        booking.status = 'COMPLETED';
        booking.updatedAt = new Date();
      }
      // Notifikasi ke tenant
      this.createNotification({
        userId: payment.tenantId,
        title: '✅ Pembayaran Dikonfirmasi!',
        message: `Pembayaran Anda sebesar Rp${payment.jumlahTransfer.toLocaleString('id-ID')} untuk kos "${kos?.nama}" telah dikonfirmasi. Selamat datang sebagai penghuni!`,
        type: 'BOOKING_APPROVED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    } else {
      payment.status = 'REJECTED';
      payment.alasanPenolakan = alasanPenolakan;
      payment.updatedAt = new Date();
      // Notifikasi ke tenant
      this.createNotification({
        userId: payment.tenantId,
        title: '❌ Pembayaran Ditolak',
        message: `Bukti pembayaran Anda untuk kos "${kos?.nama}" ditolak.${alasanPenolakan ? ` Alasan: ${alasanPenolakan}` : ''} Silakan kirim ulang bukti yang benar.`,
        type: 'BOOKING_REJECTED',
        link: '/tenant/dashboard?tab=pembayaran'
      });
    }

    return {
      ...payment,
      booking: booking || null,
      kos: kos ? { id: kos.id, nama: kos.nama } : null,
      tenant: tenant ? { id: tenant.id, name: tenant.name } : null
    };
  }

  async getOwnerFinancialSummary(ownerId) {
    const ownerKosIds = this.kos.filter(k => k.ownerId === ownerId).map(k => k.id);
    const ownerPayments = this.payments.filter(p => p.ownerId === ownerId);

    const confirmed = ownerPayments.filter(p => p.status === 'CONFIRMED');
    const pending = ownerPayments.filter(p => p.status === 'PENDING');
    const rejected = ownerPayments.filter(p => p.status === 'REJECTED');

    const totalPendapatan = confirmed.reduce((sum, p) => sum + Number(p.jumlahTransfer), 0);
    const menungguKonfirmasi = pending.reduce((sum, p) => sum + Number(p.jumlahTransfer), 0);

    // Per-bulan summary (last 6 months)
    const now = new Date();
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
      const monthPayments = confirmed.filter(p => {
        const pd = new Date(p.updatedAt);
        return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
      });
      monthlyData.push({
        bulan: label,
        pendapatan: monthPayments.reduce((sum, p) => sum + Number(p.jumlahTransfer), 0),
        jumlahTransaksi: monthPayments.length
      });
    }

    return {
      totalPendapatan,
      menungguKonfirmasi,
      totalTransaksiKonfirmasi: confirmed.length,
      totalTransaksiPending: pending.length,
      totalTransaksiDitolak: rejected.length,
      monthlyData
    };
  }

  // ================= LANDMARK & FACILITY METADATA (PHASE 13) =================
  async getCampusLandmarks() {
    const landmarks = [
      {
        id: 'unsoed',
        nama: 'Universitas Jenderal Soedirman (UNSOED)',
        kota: 'Purwokerto',
        area: 'Grendeng & Karangwangkal',
        keywords: ['unsoed', 'grendeng', 'soeparno', 'karangwangkal', 'kampus', 'hr boenyamin', 'boenyamin'],
        lat: -7.4243,
        lng: 109.2486
      },
      {
        id: 'ugm',
        nama: 'Universitas Gadjah Mada (UGM)',
        kota: 'Yogyakarta',
        area: 'Kaliurang, Bulaksumur & Sleman',
        keywords: ['ugm', 'gadjah mada', 'kaliurang', 'bulaksumur', 'uny', 'sleman', 'yogyakarta'],
        lat: -7.7602,
        lng: 110.3804
      },
      {
        id: 'ui',
        nama: 'Universitas Indonesia (UI Depok & Salemba)',
        kota: 'Depok / Jakarta',
        area: 'Margonda, Kukusan & Salemba',
        keywords: ['ui', 'universitas indonesia', 'margonda', 'kukusan', 'pondok cina', 'depok', 'salemba'],
        lat: -6.3689,
        lng: 106.8321
      },
      {
        id: 'itb',
        nama: 'Institut Teknologi Bandung (ITB & UNPAD)',
        kota: 'Bandung',
        area: 'Dago, Ganesha & Dipatiukur',
        keywords: ['itb', 'ganesha', 'dago', 'dipatiukur', 'unpad', 'bandung', 'coblong'],
        lat: -6.8789,
        lng: 107.6189
      },
      {
        id: 'ub',
        nama: 'Universitas Brawijaya (UB & UM)',
        kota: 'Malang',
        area: 'Soekarno Hatta (Suhat) & Lowokwaru',
        keywords: ['ub', 'brawijaya', 'soekarno hatta', 'suhat', 'lowokwaru', 'malang', 'polinema'],
        lat: -7.9482,
        lng: 112.6179
      },
      {
        id: 'unair',
        nama: 'Universitas Airlangga (UNAIR & ITS)',
        kota: 'Surabaya',
        area: 'Gubeng, Dharmawangsa & Sukolilo',
        keywords: ['unair', 'airlangga', 'its', 'dharmawangsa', 'gubeng', 'sukolilo', 'surabaya'],
        lat: -7.2721,
        lng: 112.7562
      },
      {
        id: 'undip',
        nama: 'Universitas Diponegoro (UNDIP Tembalang)',
        kota: 'Semarang',
        area: 'Tembalang & Banjarsari',
        keywords: ['undip', 'diponegoro', 'tembalang', 'banjarsari', 'pleburan', 'semarang'],
        lat: -7.0543,
        lng: 110.4389
      },
      {
        id: 'bali',
        nama: 'Universitas Udayana (UNUD & Denpasar)',
        kota: 'Denpasar / Bali',
        area: 'Renon, Jimbaran & Sanur',
        keywords: ['bali', 'denpasar', 'renon', 'udayana', 'unud', 'jimbaran', 'batanghari'],
        lat: -8.6789,
        lng: 115.2341
      },
      {
        id: 'ump',
        nama: 'Universitas Muhammadiyah Purwokerto (UMP)',
        kota: 'Purwokerto',
        area: 'Dukuhwaluh, Kembaran',
        keywords: ['ump', 'dukuhwaluh', 'raden patah', 'muhammadiyah', 'kembaran'],
        lat: -7.4180,
        lng: 109.2710
      },
      {
        id: 'telkom',
        nama: 'Telkom University Purwokerto (TUP)',
        kota: 'Purwokerto',
        area: 'Jl. D.I. Panjaitan, Purwokerto Selatan',
        keywords: ['telkom', 'panjaitan', 'd.i. panjaitan', 'berkoh', 'purwokerto selatan'],
        lat: -7.4420,
        lng: 109.2550
      },
      {
        id: 'uinsaizu',
        nama: 'UIN Prof. K.H. Saifuddin Zuhri (UIN Saizu)',
        kota: 'Purwokerto',
        area: 'Karangkobar, Purwokerto Barat',
        keywords: ['uin', 'saizu', 'saifuddin zuhri', 'karangkobar', 'purwokerto barat'],
        lat: -7.4120,
        lng: 109.2250
      },
      {
        id: 'stasiun',
        nama: 'Stasiun Purwokerto & Pusat Kota',
        kota: 'Purwokerto',
        area: 'Kober & Alun-Alun Purwokerto',
        keywords: ['stasiun', 'kober', 'bantarsoka', 'alun-alun', 'pasar manis'],
        lat: -7.4215,
        lng: 109.2222
      }
    ];

    return landmarks.map(lm => {
      const count = this.kos.filter(k => {
        if (k.status !== 'ACTIVE') return false;
        const textToSearch = `${k.nama} ${k.alamat} ${k.kota} ${k.deskripsi || ''}`.toLowerCase();
        return lm.keywords.some(kw => textToSearch.includes(kw));
      }).length;
      return { ...lm, totalKos: count };
    });
  }

  async getFacilityMetadata() {
    return {
      kategoriFasilitas: [
        {
          id: 'kamar',
          nama: 'Fasilitas Kamar',
          deskripsi: 'Fasilitas di dalam kamar pribadi',
          items: ['AC', 'Kamar mandi dalam', 'Kasur', 'Lemari', 'Meja & Kursi', 'WiFi', 'Jendela', 'Water Heater', 'Listrik']
        },
        {
          id: 'bersama',
          nama: 'Fasilitas Bersama',
          deskripsi: 'Fasilitas umum bersama penghuni kos',
          items: ['Dapur Bersama', 'Kulkas Bersama', 'Ruang Tamu', 'Mesin Cuci', 'Dispenser', 'Jemuran', 'Balkon']
        },
        {
          id: 'parkir_keamanan',
          nama: 'Parkir & Keamanan',
          deskripsi: 'Keamanan dan tempat penyimpanan kendaraan',
          items: ['Parkir Motor', 'Parkir Mobil', 'Akses 24 Jam', 'CCTV', 'Penjaga Kos', 'Pagar Tertutup']
        }
      ],
      peraturanPopuler: [
        { id: '24jam', label: 'Akses Bebas 24 Jam', deskripsi: 'Tidak ada batasan jam malam gerbang kos' },
        { id: 'pasutri', label: 'Boleh Pasutri', deskripsi: 'Menerima pasangan suami istri' },
        { id: 'bebas_asap', label: 'Bebas Asap Rokok', deskripsi: 'Kamar dilarang merokok' }
      ]
    };
  }

  // ================= ROOM AVAILABILITY & RENTAL EXTENSION (PHASE 14) =================

  async requestBookingExtension(bookingId, tenantId, durasiBulan, catatan) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan.');
    if (booking.tenantId !== tenantId) throw new Error('Anda tidak memiliki akses ke booking ini.');
    if (!['APPROVED', 'COMPLETED'].includes(booking.status)) {
      throw new Error('Hanya booking yang disetujui atau aktif yang dapat diperpanjang.');
    }

    if (booking.extensionRequest && booking.extensionRequest.status === 'PENDING') {
      throw new Error('Pengajuan perpanjangan sebelumnya masih menunggu konfirmasi pemilik kos.');
    }

    const durasi = Number(durasiBulan) || 1;
    const kos = this.kos.find(k => k.id === booking.kosId);
    const room = kos?.rooms?.find(r => r.id === booking.roomId);
    const monthlyRate = Number(room?.harga || kos?.hargaBulanan || (booking.totalHarga / (booking.durasiBulan || 1)));
    const biayaPerpanjangan = monthlyRate * durasi;

    const extensionRequest = {
      id: `ext-${Date.now()}`,
      durasiBulan: durasi,
      biayaPerpanjangan,
      catatan: catatan ? catatan.trim() : '',
      status: 'PENDING', // PENDING | APPROVED | REJECTED
      alasanPenolakan: '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    booking.extensionRequest = extensionRequest;
    booking.updatedAt = new Date();

    const tenant = this.users.find(u => u.id === tenantId);
    if (kos?.ownerId) {
      this.createNotification({
        userId: kos.ownerId,
        title: '🔄 Pengajuan Perpanjangan Sewa',
        message: `${tenant?.name || 'Penyewa'} mengajukan perpanjangan sewa kamar (${durasi} bulan) di "${kos.nama}". Segera tinjau pengajuan ini.`,
        type: 'BOOKING_NEW',
        link: '/owner/dashboard?tab=booking'
      });
    }

    return {
      ...booking,
      kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota } : null,
      room: room || null
    };
  }

  async processExtensionApproval(bookingId, ownerId, action, alasanPenolakan) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan.');

    const kos = this.kos.find(k => k.id === booking.kosId);
    if (!kos || (kos.ownerId !== ownerId && ownerId !== 'admin-1')) {
      throw new Error('Akses ditolak. Anda bukan pemilik dari properti kos ini.');
    }

    if (!booking.extensionRequest || booking.extensionRequest.status !== 'PENDING') {
      throw new Error('Tidak ada pengajuan perpanjangan aktif yang menunggu konfirmasi.');
    }

    const ext = booking.extensionRequest;
    if (action === 'APPROVE') {
      ext.status = 'APPROVED';
      ext.updatedAt = new Date();

      booking.durasiBulan = (Number(booking.durasiBulan) || 1) + Number(ext.durasiBulan);
      booking.totalHarga = (Number(booking.totalHarga) || 0) + Number(ext.biayaPerpanjangan);
      booking.updatedAt = new Date();

      this.createNotification({
        userId: booking.tenantId,
        title: '✅ Perpanjangan Sewa Disetujui',
        message: `Pemilik telah menyetujui perpanjangan sewa kamar Anda di "${kos.nama}" selama ${ext.durasiBulan} bulan.`,
        type: 'BOOKING_APPROVED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    } else {
      ext.status = 'REJECTED';
      ext.alasanPenolakan = alasanPenolakan || 'Tidak dapat memperpanjang sewa saat ini.';
      ext.updatedAt = new Date();
      booking.updatedAt = new Date();

      this.createNotification({
        userId: booking.tenantId,
        title: '❌ Perpanjangan Sewa Ditolak',
        message: `Pengajuan perpanjangan sewa Anda di "${kos.nama}" ditolak.${alasanPenolakan ? ` Alasan: ${alasanPenolakan}` : ''}`,
        type: 'BOOKING_REJECTED',
        link: '/tenant/dashboard?tab=riwayat'
      });
    }

    return {
      ...booking,
      kos: { id: kos.id, nama: kos.nama, kota: kos.kota },
      extensionRequest: ext
    };
  }

  async getRoomAvailabilitySchedule(kosId) {
    const kos = this.kos.find(k => k.id === kosId);
    if (!kos) throw new Error('Kos tidak ditemukan.');

    const rooms = (kos.rooms || []).map(room => {
      // Cari booking aktif untuk kamar ini
      const activeBooking = this.bookings.find(b =>
        b.kosId === kosId &&
        b.roomId === room.id &&
        ['APPROVED', 'PENDING'].includes(b.status)
      );

      let statusDisplay = room.status; // AVAILABLE / OCCUPIED
      let nextAvailableDate = null;
      let occupant = null;
      let rentalEndDate = null;
      let daysRemaining = null;

      if (activeBooking && activeBooking.status === 'APPROVED') {
        const start = new Date(activeBooking.tanggalMulai || activeBooking.createdAt);
        const durationMonths = Number(activeBooking.durasiBulan) || 1;
        const end = new Date(start);
        end.setMonth(end.getMonth() + durationMonths);

        rentalEndDate = end.toISOString();
        nextAvailableDate = end.toISOString();

        const diffTime = end.getTime() - Date.now();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const tenant = this.users.find(u => u.id === activeBooking.tenantId);
        occupant = tenant ? { id: tenant.id, name: tenant.name } : null;
      }

      return {
        ...room,
        currentBookingId: activeBooking ? activeBooking.id : null,
        bookingStatus: activeBooking ? activeBooking.status : null,
        rentalEndDate,
        nextAvailableDate,
        daysRemaining,
        occupant
      };
    });

    return {
      kosId: kos.id,
      namaKos: kos.nama,
      kota: kos.kota,
      totalKamar: kos.totalKamar,
      kamarTersedia: kos.kamarTersedia,
      rooms
    };
  }

  async getExpiringRentals(userId, role) {
    let bookingsToCheck = [];
    if (role === 'OWNER') {
      const ownerKosIds = this.kos.filter(k => k.ownerId === userId).map(k => k.id);
      bookingsToCheck = this.bookings.filter(b => ownerKosIds.includes(b.kosId) && b.status === 'APPROVED');
    } else {
      bookingsToCheck = this.bookings.filter(b => b.tenantId === userId && b.status === 'APPROVED');
    }

    return bookingsToCheck.map(b => {
      const kos = this.kos.find(k => k.id === b.kosId);
      const room = kos?.rooms?.find(r => r.id === b.roomId);
      const tenant = this.users.find(u => u.id === b.tenantId);

      const start = new Date(b.tanggalMulai || b.createdAt);
      const durationMonths = Number(b.durasiBulan) || 1;
      const end = new Date(start);
      end.setMonth(end.getMonth() + durationMonths);

      const diffTime = end.getTime() - Date.now();
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...b,
        kos: kos ? { id: kos.id, nama: kos.nama, kota: kos.kota, foto: kos.foto } : null,
        room: room || null,
        tenant: tenant ? { id: tenant.id, name: tenant.name, phone: tenant.phone } : null,
        rentalEndDate: end.toISOString(),
        daysRemaining,
        isExpiringSoon: daysRemaining <= 14 && daysRemaining >= 0,
        isExpired: daysRemaining < 0
      };
    }).sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  // ================= DIGITAL RENTAL AGREEMENT & INVOICE (PHASE 15) =================

  async getOrCreateAgreement(bookingId, userId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking sewa tidak ditemukan.');

    const kos = this.kos.find(k => k.id === booking.kosId);
    if (!kos) throw new Error('Properti kos tidak ditemukan.');

    const tenant = this.users.find(u => u.id === booking.tenantId);
    const owner = this.users.find(u => u.id === kos.ownerId);

    // Validasi akses: Hanya tenant bersangkutan, owner kos, atau admin
    if (booking.tenantId !== userId && kos.ownerId !== userId && userId !== 'admin-1') {
      throw new Error('Akses ditolak. Anda tidak memiliki wewenang untuk melihat perjanjian sewa ini.');
    }

    if (!this.agreements) this.agreements = [];
    let agreement = this.agreements.find(a => a.bookingId === bookingId);

    if (!agreement) {
      const room = kos.rooms?.find(r => r.id === booking.roomId);
      const startDate = new Date(booking.tanggalMulai || booking.createdAt);
      const durationMonths = Number(booking.durasiBulan) || 1;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + durationMonths);

      const year = startDate.getFullYear();
      const nomorSurat = `SPK/${year}/KOS-${kos.id.slice(-4).toUpperCase()}/${booking.id.slice(-5).toUpperCase()}`;

      agreement = {
        id: `agr-${booking.id}`,
        bookingId: booking.id,
        nomorSurat,
        status: 'DRAFT', // DRAFT | PARTIALLY_SIGNED | OFFICIALLY_SIGNED
        createdAt: new Date(),
        updatedAt: new Date(),
        kos: {
          id: kos.id,
          nama: kos.nama,
          alamat: kos.alamat,
          kota: kos.kota,
          type: kos.type,
          aturan: kos.aturan || 'Menjaga ketertiban dan kenyamanan bersama.'
        },
        room: {
          id: room?.id || 'room-standard',
          nomorKamar: room?.nomorKamar || 'Kamar Utama',
          hargaBulanan: Number(room?.harga || kos.hargaBulanan)
        },
        pihakPertama: {
          id: owner?.id || kos.ownerId,
          nama: owner?.name || 'Pemilik Kos',
          email: owner?.email || 'owner@kosfinder.com',
          phone: owner?.phone || '-',
          alamat: owner?.profile?.address || kos.alamat,
          role: 'PEMILIK / PENGELOLA KOS'
        },
        pihakKedua: {
          id: tenant?.id || booking.tenantId,
          nama: tenant?.name || 'Penyewa',
          email: tenant?.email || 'tenant@kosfinder.com',
          phone: tenant?.phone || '-',
          alamat: tenant?.profile?.address || 'Sesuai KTP / Identitas Terdaftar',
          occupation: tenant?.profile?.occupation || 'Mahasiswa / Pekerja',
          emergencyContact: tenant?.profile?.emergencyContact || '-',
          role: 'PENYEWA / PENGHUNI KAMAR'
        },
        ketentuanSewa: {
          tanggalMulai: startDate.toISOString(),
          tanggalSelesai: endDate.toISOString(),
          durasiBulan: durationMonths,
          biayaSewaPerBulan: Number(room?.harga || kos.hargaBulanan),
          totalBiayaSewa: Number(booking.totalHarga),
          uangJaminanDeposit: 0,
          fasilitasKamar: kos.fasilitas || ['Kasur', 'Lemari', 'WiFi']
        },
        pasalPasal: [
          {
            pasal: 'Pasal 1: Objek dan Tujuan Sewa',
            isi: 'Pihak Pertama menyewakan kepada Pihak Kedua satu unit kamar kos di properti tersebut di atas untuk keperluan tempat tinggal yang sah dan tertib hukum Republik Indonesia.'
          },
          {
            pasal: 'Pasal 2: Jangka Waktu Sewa',
            isi: `Sewa berlaku selama ${durationMonths} bulan terhitung sejak tanggal mulai hingga tanggal selesai yang disepakati. Perpanjangan masa sewa wajib diajukan selambat-lambatnya 14 (empat belas) hari sebelum masa sewa berakhir melalui platform KosFinder.`
          },
          {
            pasal: 'Pasal 3: Biaya Sewa dan Ketentuan Pembayaran',
            isi: `Pihak Kedua berkewajiban melunasi total biaya sewa sebesar Rp${Number(booking.totalHarga).toLocaleString('id-ID')} kepada Pihak Pertama melalui metode pembayaran yang telah dikonfirmasi sah pada sistem.`
          },
          {
            pasal: 'Pasal 4: Hak dan Kewajiban Pemilik Kos (Pihak Pertama)',
            isi: 'Pihak Pertama berhak menerima pembayaran tepat waktu dan berhak menegur jika terjadi pelanggaran aturan. Pihak Pertama wajib menjamin kenyamanan, keamanan fasilitas bersama, dan ketersediaan utilitas yang diperjanjikan.'
          },
          {
            pasal: 'Pasal 5: Hak dan Kewajiban Penyewa (Pihak Kedua)',
            isi: 'Pihak Kedua berhak menempati kamar yang disewa dengan aman dan menikmati fasilitas yang tersedia. Pihak Kedua dilarang memindahtangankan sewa kepada pihak ketiga tanpa izin tertulis dari Pihak Pertama, dilarang membawa zat terlarang (narkoba/miras), serta wajib menaati jam malam dan aturan kos.'
          },
          {
            pasal: 'Pasal 6: Pemeliharaan Fasilitas dan Ganti Rugi',
            isi: 'Pihak Kedua wajib menjaga kebersihan dan keutuhan fasilitas di dalam kamar. Kerusakan yang disebabkan oleh kelalaian atau kesengajaan Pihak Kedua menjadi tanggung jawab Pihak Kedua untuk diperbaiki atau diganti.'
          },
          {
            pasal: 'Pasal 7: Penyelesaian Perselisihan',
            isi: 'Apabila di kemudian hari timbul perselisihan dalam pelaksanaan perjanjian ini, kedua belah pihak sepakat untuk menyelesaikannya secara musyawarah untuk mufakat.'
          }
        ],
        signatures: {
          tenant: {
            signed: false,
            signedAt: null,
            signatureName: '',
            ipAddress: null
          },
          owner: {
            signed: false,
            signedAt: null,
            signatureName: '',
            ipAddress: null
          }
        }
      };

      this.agreements.push(agreement);
    }

    return agreement;
  }

  async signAgreement(bookingId, userId, role, signatureName, ipAddress = '127.0.0.1') {
    const agreement = await this.getOrCreateAgreement(bookingId, userId);
    const booking = this.bookings.find(b => b.id === bookingId);
    const kos = this.kos.find(k => k.id === booking?.kosId);

    const isTenant = booking.tenantId === userId;
    const isOwner = kos?.ownerId === userId || role === 'OWNER';

    if (!isTenant && !isOwner && userId !== 'admin-1') {
      throw new Error('Akses ditolak. Anda tidak berhak menandatangani dokumen perjanjian ini.');
    }

    const timestamp = new Date();

    if (isTenant) {
      agreement.signatures.tenant = {
        signed: true,
        signedAt: timestamp,
        signatureName: signatureName || agreement.pihakKedua.nama,
        ipAddress
      };
    }

    if (isOwner) {
      agreement.signatures.owner = {
        signed: true,
        signedAt: timestamp,
        signatureName: signatureName || agreement.pihakPertama.nama,
        ipAddress
      };
    }

    const tenantSigned = agreement.signatures.tenant.signed;
    const ownerSigned = agreement.signatures.owner.signed;

    if (tenantSigned && ownerSigned) {
      agreement.status = 'OFFICIALLY_SIGNED';
      agreement.signedOfficiallyAt = timestamp;

      // Notifikasi ke kedua belah pihak
      this.createNotification({
        userId: booking.tenantId,
        title: '📄 Surat Perjanjian Sewa (SPK) Telah Sah',
        message: `Surat Perjanjian Sewa untuk kos "${kos?.nama}" telah resmi ditandatangani oleh Pemilik dan Penyewa. Anda dapat mengunduh dokumen resmi kapan saja.`,
        type: 'BOOKING_APPROVED',
        link: '/tenant/dashboard?tab=riwayat'
      });

      if (kos?.ownerId) {
        this.createNotification({
          userId: kos.ownerId,
          title: '📄 Surat Perjanjian Sewa (SPK) Telah Sah',
          message: `Surat Perjanjian Sewa untuk kos "${kos?.nama}" telah resmi ditandatangani lengkap bersama penyewa ${agreement.pihakKedua.nama}.`,
          type: 'BOOKING_APPROVED',
          link: '/owner/dashboard?tab=booking'
        });
      }
    } else {
      agreement.status = 'PARTIALLY_SIGNED';
      // Beritahu pihak yang belum tanda tangan
      if (isTenant && !ownerSigned && kos?.ownerId) {
        this.createNotification({
          userId: kos.ownerId,
          title: '✍️ Tanda Tangan SPK dari Penyewa',
          message: `${agreement.pihakKedua.nama} telah menandatangani Surat Perjanjian Sewa kos "${kos?.nama}". Silakan bubuhkan tanda tangan Anda.`,
          type: 'BOOKING_NEW',
          link: '/owner/dashboard?tab=booking'
        });
      } else if (isOwner && !tenantSigned) {
        this.createNotification({
          userId: booking.tenantId,
          title: '✍️ Pemilik Telah Menandatangani SPK',
          message: `Pemilik kos "${kos?.nama}" telah menandatangani Surat Perjanjian Sewa. Silakan konfirmasi tanda tangan Anda.`,
          type: 'BOOKING_NEW',
          link: '/tenant/dashboard?tab=riwayat'
        });
      }
    }

    agreement.updatedAt = timestamp;
    return agreement;
  }

  async getInvoiceAndReceipt(bookingId, userId) {
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) throw new Error('Booking tidak ditemukan.');

    const kos = this.kos.find(k => k.id === booking.kosId);
    if (!kos) throw new Error('Properti kos tidak ditemukan.');

    if (booking.tenantId !== userId && kos.ownerId !== userId && userId !== 'admin-1') {
      throw new Error('Akses ditolak. Anda tidak memiliki wewenang untuk mengakses invoice/kwitansi ini.');
    }

    const tenant = this.users.find(u => u.id === booking.tenantId);
    const owner = this.users.find(u => u.id === kos.ownerId);
    const room = kos.rooms?.find(r => r.id === booking.roomId);
    const payment = this.payments.find(p => p.bookingId === bookingId && p.status === 'CONFIRMED') ||
                    this.payments.find(p => p.bookingId === bookingId) || null;

    const invoiceDate = new Date(booking.createdAt);
    const year = invoiceDate.getFullYear();
    const nomorInvoice = `INV/${year}/KOSF/${booking.id.toUpperCase()}`;
    const nomorKwitansi = `KW/${year}/KOSF/${booking.id.toUpperCase()}`;
    const verificationCode = `KOSF-AUTH-${Buffer.from(booking.id).toString('hex').slice(0, 8).toUpperCase()}`;

    const monthlyPrice = Number(room?.harga || kos.hargaBulanan || (booking.totalHarga / (booking.durasiBulan || 1)));
    const durationMonths = Number(booking.durasiBulan) || 1;
    const subtotal = monthlyPrice * durationMonths;
    const biayaLayananPlatform = 0; // Free / Rp 0
    const total = subtotal + biayaLayananPlatform;

    const isPaid = booking.status === 'APPROVED' || payment?.status === 'CONFIRMED';

    return {
      nomorInvoice,
      nomorKwitansi,
      tanggalInvoice: invoiceDate.toISOString(),
      tanggalKwitansi: isPaid ? (payment?.updatedAt || new Date()).toISOString() : null,
      statusPembayaran: isPaid ? 'LUNAS' : 'MENUNGGU_PEMBAYARAN',
      verificationCode,
      booking: {
        id: booking.id,
        durasiBulan: durationMonths,
        tanggalMulai: booking.tanggalMulai || booking.createdAt,
        totalHarga: booking.totalHarga,
        catatan: booking.catatan || ''
      },
      kos: {
        id: kos.id,
        nama: kos.nama,
        alamat: kos.alamat,
        kota: kos.kota,
        type: kos.type
      },
      room: {
        id: room?.id || 'room-standard',
        nomorKamar: room?.nomorKamar || 'Kamar Utama',
        hargaBulanan: monthlyPrice
      },
      tenant: {
        id: tenant?.id || booking.tenantId,
        nama: tenant?.name || 'Penyewa',
        email: tenant?.email || '-',
        phone: tenant?.phone || '-'
      },
      owner: {
        id: owner?.id || kos.ownerId,
        nama: owner?.name || 'Pemilik Kos',
        email: owner?.email || '-',
        phone: owner?.phone || '-'
      },
      paymentDetails: {
        metodePembayaran: payment?.metodePembayaran || 'Transfer Bank / Online',
        namaRekeningPengirim: payment?.namaRekening || tenant?.name || '-',
        nomorRekeningPengirim: payment?.nomorRekening || '-',
        jumlahTransfer: payment?.jumlahTransfer || total,
        tanggalBayar: payment?.updatedAt || booking.createdAt
      },
      rincianItem: [
        {
          deskripsi: `Sewa Kamar ${room?.nomorKamar || 'Utama'} (${kos.nama}) - ${durationMonths} Bulan`,
          durasi: `${durationMonths} Bulan`,
          hargaSatuan: monthlyPrice,
          total: subtotal
        },
        {
          deskripsi: 'Biaya Administrasi & Layanan Aplikasi Platform KosFinder',
          durasi: '1x Transaksi',
          hargaSatuan: 0,
          total: 0
        }
      ],
      subtotal,
      biayaLayanan: 0,
      total
    };
  }
}



const memoryStore = new MemoryDataStore();
let isPostgresAvailable = null;

// Token reset password (ephemeral, berlaku 1 jam). Disimpan di memori
// agar alur reset tetap berfungsi pada mode fallback maupun PostgreSQL.
const passwordResetTokens = new Map();

/**
 * Cek status database saat runtime
 */
export const getDatabaseStatus = async () => {
  if (isPostgresAvailable === null) {
    const check = await checkDatabaseConnection();
    isPostgresAvailable = check.connected;
    if (isPostgresAvailable) {
      console.log('✅ [DATABASE]: Menggunakan koneksi PostgreSQL aktif.');
    } else {
      console.log('ℹ️ [DATABASE]: PostgreSQL server offline. Menggunakan Local Memory Store fallback untuk development.');
    }
  }
  return {
    isPostgres: isPostgresAvailable,
    store: isPostgresAvailable ? prisma : memoryStore
  };
};

/**
 * Unified Database Operations (Abstraksi data access layer)
 */
export const db = {
  // USER METHODS
  async findUserByEmail(email) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
        include: { profile: true }
      });
    }
    return await memoryStore.findUserByEmail(email);
  },

  async findUserById(id) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.user.findUnique({
        where: { id },
        include: { profile: true }
      });
    }
    return await memoryStore.findUserById(id);
  },

  async createUser(userData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { profile, ...userFields } = userData;
      return await prisma.user.create({
        data: {
          ...userFields,
          email: userFields.email.toLowerCase(),
          profile: {
            create: profile || {}
          }
        },
        include: { profile: true }
      });
    }
    return await memoryStore.createUser(userData);
  },

  // KOS METHODS
  async getAllKos(options) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      // Implementasi Prisma PostgreSQL
      const page = Number(options.page) || 1;
      const limit = Number(options.limit) || 10;
      const skip = (page - 1) * limit;

      const where = {};
      if (options.status) where.status = options.status;
      if (options.ownerId) where.ownerId = options.ownerId;
      if (options.type) where.type = options.type.toUpperCase();
      if (options.kota) where.kota = { contains: options.kota, mode: 'insensitive' };
      if (options.search) {
        where.OR = [
          { nama: { contains: options.search, mode: 'insensitive' } },
          { kota: { contains: options.search, mode: 'insensitive' } },
          { alamat: { contains: options.search, mode: 'insensitive' } }
        ];
      }
      if (options.minPrice || options.maxPrice) {
        where.hargaBulanan = {};
        if (options.minPrice) where.hargaBulanan.gte = Number(options.minPrice);
        if (options.maxPrice) where.hargaBulanan.lte = Number(options.maxPrice);
      }
      if (options.minRating) {
        where.rating = { gte: Number(options.minRating) };
      }
      if (options.availableOnly) {
        where.kamarTersedia = { gt: 0 };
      }

      let orderBy = { createdAt: 'desc' };
      if (options.sort === 'price-asc') orderBy = { hargaBulanan: 'asc' };
      if (options.sort === 'price-desc') orderBy = { hargaBulanan: 'desc' };
      if (options.sort === 'rating-desc') orderBy = { rating: 'desc' };
      if (options.sort === 'popular') orderBy = { jumlahReview: 'desc' };

      const [total, data] = await Promise.all([
        prisma.kos.count({ where }),
        prisma.kos.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            owner: {
              select: { id: true, name: true, phone: true, avatar: true }
            }
          }
        })
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }
    return await memoryStore.getAllKos(options);
  },

  async getKosById(id) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.kos.findUnique({
        where: { id },
        include: {
          owner: {
            select: { id: true, name: true, phone: true, avatar: true }
          },
          rooms: true,
          reviews: {
            include: {
              tenant: {
                select: { id: true, name: true, avatar: true }
              }
            }
          }
        }
      });
    }
    return await memoryStore.getKosById(id);
  },

  async createKos(kosData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const totalRooms = Number(kosData.totalKamar) || 4;
      const roomsData = [];
      for (let i = 1; i <= totalRooms; i++) {
        const pad = i < 10 ? `0${i}` : `${i}`;
        roomsData.push({
          nomorKamar: `Kamar ${pad}`,
          harga: kosData.hargaBulanan,
          status: 'AVAILABLE'
        });
      }

      return await prisma.kos.create({
        data: {
          ...kosData,
          totalKamar: totalRooms,
          kamarTersedia: totalRooms,
          rooms: {
            create: roomsData
          }
        },
        include: {
          owner: {
            select: { id: true, name: true, phone: true, avatar: true }
          },
          rooms: true
        }
      });
    }
    return await memoryStore.createKos(kosData);
  },

  async updateKos(id, updateData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.kos.update({
        where: { id },
        data: updateData,
        include: {
          owner: {
            select: { id: true, name: true, phone: true, avatar: true }
          },
          rooms: true
        }
      });
    }
    return await memoryStore.updateKos(id, updateData);
  },

  async deleteKos(id) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      await prisma.kos.delete({ where: { id } });
      return true;
    }
    return await memoryStore.deleteKos(id);
  },

  // TENANT & PROFILE METHODS
  async updateUserProfile(userId, updateData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { bio, gender, address, occupation, emergencyContact, ...mainFields } = updateData;
      return await prisma.user.update({
        where: { id: userId },
        data: {
          ...mainFields,
          profile: {
            upsert: {
              create: { bio, gender, address, occupation, emergencyContact },
              update: { bio, gender, address, occupation, emergencyContact }
            }
          }
        },
        include: { profile: true }
      });
    }
    return await memoryStore.updateUserProfile(userId, updateData);
  },

  async getBookingsByTenantId(tenantId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.booking.findMany({
        where: { tenantId },
        include: {
          kos: {
            include: {
              owner: {
                select: { id: true, name: true, phone: true }
              }
            }
          },
          room: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await memoryStore.getBookingsByTenantId(tenantId);
  },

  async createBooking(bookingData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.$transaction(async (tx) => {
        const room = await tx.room.findFirst({ where: { id: bookingData.roomId, kosId: bookingData.kosId } });
        if (!room) throw new Error('Kamar yang dipilih tidak ditemukan pada kos ini.');
        if (room.status !== 'AVAILABLE') throw new Error('Kamar ini sedang tidak tersedia. Silakan pilih kamar lain yang masih kosong.');

        const roomClash = await tx.booking.findFirst({
          where: { roomId: room.id, status: { in: ['PENDING', 'APPROVED'] } }
        });
        if (roomClash) throw new Error('Kamar ini sudah memiliki pengajuan sewa yang aktif. Silakan pilih kamar lain.');

        const tenantClash = await tx.booking.findFirst({
          where: { tenantId: bookingData.tenantId, kosId: bookingData.kosId, status: { in: ['PENDING', 'APPROVED'] } }
        });
        if (tenantClash) throw new Error('Anda sudah memiliki pengajuan sewa aktif untuk kos ini.');

        return await tx.booking.create({
          data: {
            tenantId: bookingData.tenantId,
            kosId: bookingData.kosId,
            roomId: bookingData.roomId,
            tanggalMulai: new Date(bookingData.tanggalMulai),
            durasiBulan: Number(bookingData.durasiBulan) || 1,
            totalHarga: bookingData.totalHarga,
            catatan: bookingData.catatan || null,
            status: 'PENDING'
          },
          include: {
            kos: {
              include: {
                owner: {
                  select: { id: true, name: true, phone: true }
                }
              }
            },
            room: true
          }
        });
      });
    }
    return await memoryStore.createBooking(bookingData);
  },

  // ================= PASSWORD RESET (Section 6) =================
  async createPasswordResetToken(email) {
    const { isPostgres } = await getDatabaseStatus();
    let user;
    if (isPostgres) {
      user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    } else {
      user = memoryStore.users.find(u => u.email === email.toLowerCase().trim());
    }
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    passwordResetTokens.set(token, {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 jam
    });
    return { token, user };
  },

  async verifyPasswordResetToken(token) {
    const record = passwordResetTokens.get(token);
    if (!record) return null;
    if (Date.now() > record.expiresAt) {
      passwordResetTokens.delete(token);
      return null;
    }
    return record;
  },

  async resetUserPassword(token, hashedPassword) {
    const record = await this.verifyPasswordResetToken(token);
    if (!record) return false;

    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      await prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } });
    } else {
      const user = memoryStore.users.find(u => u.id === record.userId);
      if (!user) return false;
      user.password = hashedPassword;
    }
    passwordResetTokens.delete(token);
    return true;
  },

  async cancelBooking(bookingId, tenantId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking || booking.tenantId !== tenantId) {
        throw new Error('Booking tidak ditemukan atau Anda tidak memiliki akses.');
      }
      if (booking.status !== 'PENDING') {
        throw new Error('Hanya booking dengan status Menunggu Konfirmasi (PENDING) yang dapat dibatalkan.');
      }
      return await prisma.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' },
        include: { kos: true, room: true }
      });
    }
    return await memoryStore.cancelBooking(bookingId, tenantId);
  },

  async getFavoritesByUserId(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.favorite.findMany({
        where: { userId },
        include: {
          kos: {
            include: {
              owner: {
                select: { id: true, name: true, phone: true, avatar: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await memoryStore.getFavoritesByUserId(userId);
  },

  async addFavorite(userId, kosId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.favorite.upsert({
        where: {
          userId_kosId: { userId, kosId }
        },
        create: { userId, kosId },
        update: {}
      });
    }
    return await memoryStore.addFavorite(userId, kosId);
  },

  async removeFavorite(userId, kosId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      try {
        await prisma.favorite.delete({
          where: {
            userId_kosId: { userId, kosId }
          }
        });
        return true;
      } catch (err) {
        return false;
      }
    }
    return await memoryStore.removeFavorite(userId, kosId);
  },

  async getTenantDashboardStats(tenantId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const [totalBookings, activeBookings, pendingBookings, rejectedBookings, cancelledBookings, totalFavorites] = await Promise.all([
        prisma.booking.count({ where: { tenantId } }),
        prisma.booking.count({ where: { tenantId, status: 'APPROVED' } }),
        prisma.booking.count({ where: { tenantId, status: 'PENDING' } }),
        prisma.booking.count({ where: { tenantId, status: 'REJECTED' } }),
        prisma.booking.count({ where: { tenantId, status: 'CANCELLED' } }),
        prisma.favorite.count({ where: { userId: tenantId } })
      ]);
      return { totalBookings, activeBookings, pendingBookings, rejectedBookings, cancelledBookings, totalFavorites };
    }
    return await memoryStore.getTenantDashboardStats(tenantId);
  },

  // OWNER METHODS
  async getOwnerDashboardStats(ownerId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const ownerKos = await prisma.kos.findMany({
        where: { ownerId },
        include: { rooms: true, bookings: true }
      });
      const kosIds = ownerKos.map(k => k.id);
      let totalRooms = 0;
      let availableRooms = 0;
      let occupiedRooms = 0;
      let estimatedRevenue = 0;

      ownerKos.forEach(k => {
        const rooms = k.rooms || [];
        totalRooms += rooms.length;
        rooms.forEach(r => {
          if (r.status === 'AVAILABLE') availableRooms++;
          if (r.status === 'OCCUPIED') {
            occupiedRooms++;
            estimatedRevenue += Number(r.harga || k.hargaBulanan || 0);
          }
        });
      });

      const [pendingBookings, approvedBookings] = await Promise.all([
        prisma.booking.count({ where: { kosId: { in: kosIds }, status: 'PENDING' } }),
        prisma.booking.count({ where: { kosId: { in: kosIds }, status: 'APPROVED' } })
      ]);

      return {
        totalProperties: ownerKos.length,
        totalRooms,
        availableRooms,
        occupiedRooms,
        pendingBookings,
        approvedBookings,
        estimatedMonthlyRevenue: estimatedRevenue
      };
    }
    return await memoryStore.getOwnerDashboardStats(ownerId);
  },

  async getKosByOwnerId(ownerId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const list = await prisma.kos.findMany({
        where: { ownerId },
        include: {
          rooms: true,
          bookings: {
            select: { id: true, status: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      return list.map(k => ({
        ...k,
        bookingsCount: k.bookings.length,
        pendingBookingsCount: k.bookings.filter(b => b.status === 'PENDING').length
      }));
    }
    return await memoryStore.getKosByOwnerId(ownerId);
  },

  async addRoomToKos(kosId, ownerId, roomData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const kos = await prisma.kos.findFirst({ where: { id: kosId, ownerId } });
      if (!kos) throw new Error('Kos tidak ditemukan atau Anda tidak memiliki akses.');

      const newRoom = await prisma.room.create({
        data: {
          kosId,
          nomorKamar: roomData.nomorKamar,
          harga: Number(roomData.harga) || Number(kos.hargaBulanan),
          status: roomData.status || 'AVAILABLE'
        }
      });
      await prisma.kos.update({
        where: { id: kosId },
        data: {
          totalKamar: { increment: 1 },
          kamarTersedia: roomData.status === 'OCCUPIED' ? undefined : { increment: 1 }
        }
      });
      return newRoom;
    }
    return await memoryStore.addRoomToKos(kosId, ownerId, roomData);
  },

  async updateRoom(roomId, ownerId, roomData) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { kos: true }
      });
      if (!room || room.kos.ownerId !== ownerId) {
        throw new Error('Kamar tidak ditemukan atau Anda tidak memiliki akses.');
      }
      const updated = await prisma.room.update({
        where: { id: roomId },
        data: roomData
      });
      const availCount = await prisma.room.count({
        where: { kosId: room.kosId, status: 'AVAILABLE' }
      });
      await prisma.kos.update({
        where: { id: room.kosId },
        data: { kamarTersedia: availCount }
      });
      return updated;
    }
    return await memoryStore.updateRoom(roomId, ownerId, roomData);
  },

  async deleteRoom(roomId, ownerId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { kos: true }
      });
      if (!room || room.kos.ownerId !== ownerId) {
        throw new Error('Kamar tidak ditemukan atau Anda tidak memiliki akses.');
      }
      await prisma.room.delete({ where: { id: roomId } });
      const [total, avail] = await Promise.all([
        prisma.room.count({ where: { kosId: room.kosId } }),
        prisma.room.count({ where: { kosId: room.kosId, status: 'AVAILABLE' } })
      ]);
      await prisma.kos.update({
        where: { id: room.kosId },
        data: { totalKamar: total, kamarTersedia: avail }
      });
      return true;
    }
    return await memoryStore.deleteRoom(roomId, ownerId);
  },

  async getBookingsByOwnerId(ownerId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.booking.findMany({
        where: {
          kos: { ownerId }
        },
        include: {
          kos: true,
          room: true,
          tenant: {
            select: { id: true, name: true, email: true, phone: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await memoryStore.getBookingsByOwnerId(ownerId);
  },

  async updateBookingStatusByOwner(bookingId, ownerId, status) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { kos: true }
      });
      if (!booking || booking.kos.ownerId !== ownerId) {
        throw new Error('Booking tidak ditemukan atau Anda tidak memiliki otoritas.');
      }
      const updated = await prisma.booking.update({
        where: { id: bookingId },
        data: { status }
      });
      if (status === 'APPROVED' && booking.roomId) {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'OCCUPIED' }
        });
      } else if ((status === 'REJECTED' || status === 'CANCELLED') && booking.roomId) {
        await prisma.room.update({
          where: { id: booking.roomId },
          data: { status: 'AVAILABLE' }
        });
      }
      const availCount = await prisma.room.count({
        where: { kosId: booking.kosId, status: 'AVAILABLE' }
      });
      await prisma.kos.update({
        where: { id: booking.kosId },
        data: { kamarTersedia: availCount }
      });
      return updated;
    }
    return await memoryStore.updateBookingStatusByOwner(bookingId, ownerId, status);
  },

  // REVIEW METHODS
  async getReviewsByKosId(kosId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const reviews = await prisma.review.findMany({
        where: { kosId },
        include: {
          tenant: {
            select: { id: true, name: true, avatar: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      const total = reviews.length;
      const averageRating = total > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1)) : 0;
      const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        if (breakdown[r.rating] !== undefined) breakdown[r.rating]++;
      });
      return { reviews, totalReviews: total, averageRating, breakdown };
    }
    return await memoryStore.getReviewsByKosId(kosId);
  },

  async createReview(data) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const existing = await prisma.review.findUnique({
        where: {
          tenantId_kosId: { tenantId: data.tenantId, kosId: data.kosId }
        }
      });
      let result;
      if (existing) {
        result = await prisma.review.update({
          where: { id: existing.id },
          data: { rating: Number(data.rating), comment: data.comment.trim() },
          include: { tenant: { select: { id: true, name: true, avatar: true } } }
        });
      } else {
        result = await prisma.review.create({
          data: {
            tenantId: data.tenantId,
            kosId: data.kosId,
            rating: Number(data.rating),
            comment: data.comment.trim()
          },
          include: { tenant: { select: { id: true, name: true, avatar: true } } }
        });
      }
      const aggregations = await prisma.review.aggregate({
        where: { kosId: data.kosId },
        _avg: { rating: true },
        _count: { id: true }
      });
      await prisma.kos.update({
        where: { id: data.kosId },
        data: {
          rating: Number(aggregations._avg.rating?.toFixed(1) || 0),
          jumlahReview: aggregations._count.id
        }
      });
      return result;
    }
    return await memoryStore.createReview(data);
  },

  async updateReview(reviewId, tenantId, data) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review || review.tenantId !== tenantId) {
        throw new Error('Ulasan tidak ditemukan atau Anda tidak memiliki izin.');
      }
      const updated = await prisma.review.update({
        where: { id: reviewId },
        data: {
          rating: data.rating ? Number(data.rating) : undefined,
          comment: data.comment ? data.comment.trim() : undefined
        },
        include: { tenant: { select: { id: true, name: true, avatar: true } } }
      });
      const aggregations = await prisma.review.aggregate({
        where: { kosId: review.kosId },
        _avg: { rating: true },
        _count: { id: true }
      });
      await prisma.kos.update({
        where: { id: review.kosId },
        data: {
          rating: Number(aggregations._avg.rating?.toFixed(1) || 0),
          jumlahReview: aggregations._count.id
        }
      });
      return updated;
    }
    return await memoryStore.updateReview(reviewId, tenantId, data);
  },

  async deleteReview(reviewId, userId, userRole) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const review = await prisma.review.findUnique({ where: { id: reviewId } });
      if (!review || (review.tenantId !== userId && userRole !== 'ADMIN')) {
        throw new Error('Ulasan tidak ditemukan atau Anda tidak memiliki hak.');
      }
      await prisma.review.delete({ where: { id: reviewId } });
      const aggregations = await prisma.review.aggregate({
        where: { kosId: review.kosId },
        _avg: { rating: true },
        _count: { id: true }
      });
      await prisma.kos.update({
        where: { id: review.kosId },
        data: {
          rating: Number(aggregations._avg.rating?.toFixed(1) || 0),
          jumlahReview: aggregations._count.id
        }
      });
      return true;
    }
    return await memoryStore.deleteReview(reviewId, userId, userRole);
  },

  async replyReviewByOwner(reviewId, ownerId, replyComment) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { kos: true }
      });
      if (!review || review.kos.ownerId !== ownerId) {
        throw new Error('Anda bukan pemilik kos dari ulasan ini.');
      }
      return await prisma.review.update({
        where: { id: reviewId },
        data: {
          ownerReply: replyComment.trim(),
          replyAt: new Date()
        },
        include: { tenant: { select: { id: true, name: true, avatar: true } } }
      });
    }
    return await memoryStore.replyReviewByOwner(reviewId, ownerId, replyComment);
  },

  async getReviewsByOwnerId(ownerId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.review.findMany({
        where: {
          kos: { ownerId }
        },
        include: {
          kos: { select: { id: true, nama: true } },
          tenant: { select: { id: true, name: true, avatar: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await memoryStore.getReviewsByOwnerId(ownerId);
  },

  // CHAT / CONVERSATION PROXY METHODS
  async getOrCreateConversation(params) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      let conv = await prisma.conversation.findUnique({
        where: {
          tenantId_ownerId_kosId: {
            tenantId: params.tenantId,
            ownerId: params.ownerId,
            kosId: params.kosId
          }
        }
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            tenantId: params.tenantId,
            ownerId: params.ownerId,
            kosId: params.kosId
          }
        });
      }
      return await this.getConversationDetails(conv.id, params.tenantId);
    }
    return await memoryStore.getOrCreateConversation(params);
  },

  async getUserConversations(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const convs = await prisma.conversation.findMany({
        where: {
          OR: [{ tenantId: userId }, { ownerId: userId }]
        },
        include: {
          tenant: { select: { id: true, name: true, avatar: true, role: true } },
          owner: { select: { id: true, name: true, avatar: true, role: true } },
          kos: { select: { id: true, nama: true, foto: true, kota: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      return convs.map(c => {
        const isTenant = c.tenantId === userId;
        const partner = isTenant ? c.owner : c.tenant;
        const lastMsg = c.messages?.[0] || null;
        return {
          id: c.id,
          partner,
          kos: c.kos ? { id: c.kos.id, nama: c.kos.nama, foto: c.kos.foto?.[0] || null, kota: c.kos.kota } : null,
          lastMessage: lastMsg,
          unreadCount: 0,
          updatedAt: c.updatedAt
        };
      });
    }
    return await memoryStore.getUserConversations(userId);
  },

  async getConversationDetails(conversationId, userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const conv = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          tenant: { select: { id: true, name: true, avatar: true, role: true, phone: true } },
          owner: { select: { id: true, name: true, avatar: true, role: true, phone: true } },
          kos: { select: { id: true, nama: true, foto: true, hargaBulanan: true, kota: true } },
          messages: {
            orderBy: { createdAt: 'asc' }
          }
        }
      });
      if (!conv) throw new Error('Percakapan tidak ditemukan.');
      if (conv.tenantId !== userId && conv.ownerId !== userId) {
        throw new Error('Akses ditolak.');
      }
      // Mark as read
      await prisma.message.updateMany({
        where: { conversationId, senderId: { not: userId }, isRead: false },
        data: { isRead: true }
      });
      const isTenant = conv.tenantId === userId;
      return {
        id: conv.id,
        partner: isTenant ? conv.owner : conv.tenant,
        kos: conv.kos ? { id: conv.kos.id, nama: conv.kos.nama, foto: conv.kos.foto?.[0] || null, hargaBulanan: conv.kos.hargaBulanan, kota: conv.kos.kota } : null,
        messages: conv.messages
      };
    }
    return await memoryStore.getConversationDetails(conversationId, userId);
  },

  async sendMessage({ conversationId, senderId, message }) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const msg = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          message: message.trim()
        },
        include: {
          sender: { select: { id: true, name: true, avatar: true } }
        }
      });
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });
      return msg;
    }
    return await memoryStore.sendMessage({ conversationId, senderId, message });
  },

  async getUnreadChatCount(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.message.count({
        where: {
          conversation: {
            OR: [{ tenantId: userId }, { ownerId: userId }]
          },
          senderId: { not: userId },
          isRead: false
        }
      });
    }
    return await memoryStore.getUnreadChatCount(userId);
  },

  // NOTIFICATION PROXY METHODS
  async createNotification(params) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.create({
        data: {
          userId: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'SYSTEM_INFO',
          link: params.link || null
        }
      });
    }
    return await memoryStore.createNotification(params);
  },

  async getUserNotifications(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
    }
    return await memoryStore.getUserNotifications(userId);
  },

  async getUnreadNotificationCount(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.count({
        where: { userId, isRead: false }
      });
    }
    return await memoryStore.getUnreadNotificationCount(userId);
  },

  async markNotificationAsRead(notificationId, userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.updateMany({
        where: { id: notificationId, userId },
        data: { isRead: true }
      });
    }
    return await memoryStore.markNotificationAsRead(notificationId, userId);
  },

  async markAllNotificationsAsRead(userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    }
    return await memoryStore.markAllNotificationsAsRead(userId);
  },

  async deleteNotification(notificationId, userId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.notification.deleteMany({
        where: { id: notificationId, userId }
      });
    }
    return await memoryStore.deleteNotification(notificationId, userId);
  },

  // ================= ADMIN METHODS =================

  async getAdminStats() {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const [totalUsers, totalKos, totalBookings, totalReviews, totalReports,
        activeKos, pendingKos, verifiedKos, tenantCount, ownerCount, adminCount,
        approvedBookings, pendingBookings, pendingReports] = await Promise.all([
        prisma.user.count(),
        prisma.kos.count(),
        prisma.booking.count(),
        prisma.review.count(),
        prisma.report.count(),
        prisma.kos.count({ where: { status: 'ACTIVE' } }),
        prisma.kos.count({ where: { status: 'PENDING' } }),
        prisma.kos.count({ where: { isVerified: true } }),
        prisma.user.count({ where: { role: 'TENANT' } }),
        prisma.user.count({ where: { role: 'OWNER' } }),
        prisma.user.count({ where: { role: 'ADMIN' } }),
        prisma.booking.count({ where: { status: 'APPROVED' } }),
        prisma.booking.count({ where: { status: 'PENDING' } }),
        prisma.report.count({ where: { status: 'PENDING' } })
      ]);
      const revenueAgg = await prisma.booking.aggregate({
        _sum: { totalHarga: true },
        where: { status: { in: ['APPROVED', 'COMPLETED'] } }
      });
      return {
        users: { total: totalUsers, tenants: tenantCount, owners: ownerCount, admins: adminCount },
        kos: { total: totalKos, active: activeKos, pending: pendingKos, verified: verifiedKos },
        bookings: { total: totalBookings, approved: approvedBookings, pending: pendingBookings },
        reviews: { total: totalReviews },
        reports: { total: totalReports, pending: pendingReports },
        revenue: { total: Number(revenueAgg._sum.totalHarga || 0) }
      };
    }
    return await memoryStore.getAdminStats();
  },

  async adminGetAllUsers(options = {}) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { role, search, page = 1, limit = 20 } = options;
      const where = {};
      if (role) where.role = role.toUpperCase();
      if (search) where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
      const [data, total] = await Promise.all([
        prisma.user.findMany({
          where,
          omit: { password: true },
          include: { profile: true },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.user.count({ where })
      ]);
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    return await memoryStore.adminGetAllUsers(options);
  },

  async adminUpdateUserRole(userId, newRole) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.user.update({ where: { id: userId }, data: { role: newRole } });
    }
    return await memoryStore.adminUpdateUserRole(userId, newRole);
  },

  async adminToggleUserStatus(userId, isVerified) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.user.update({ where: { id: userId }, data: { isVerified } });
    }
    return await memoryStore.adminToggleUserStatus(userId, isVerified);
  },

  async adminGetAllListings(options = {}) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { status, search, page = 1, limit = 20 } = options;
      const where = {};
      if (status) where.status = status.toUpperCase();
      if (search) where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { kota: { contains: search, mode: 'insensitive' } },
        { alamat: { contains: search, mode: 'insensitive' } }
      ];
      const [data, total] = await Promise.all([
        prisma.kos.findMany({
          where,
          include: { owner: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.kos.count({ where })
      ]);
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    return await memoryStore.adminGetAllListings(options);
  },

  async adminUpdateListingStatus(kosId, updates) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.kos.update({ where: { id: kosId }, data: updates });
    }
    return await memoryStore.adminUpdateListingStatus(kosId, updates);
  },

  async adminGetAllReports(options = {}) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { status, page = 1, limit = 20 } = options;
      const where = {};
      if (status) where.status = status.toUpperCase();
      const [data, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: {
            reporter: { select: { id: true, name: true, email: true } },
            kos: { select: { id: true, nama: true, kota: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.report.count({ where })
      ]);
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    return await memoryStore.adminGetAllReports(options);
  },

  async adminCreateReport(params) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.report.create({ data: params });
    }
    return await memoryStore.adminCreateReport(params);
  },

  async adminUpdateReportStatus(reportId, newStatus) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.report.update({ where: { id: reportId }, data: { status: newStatus } });
    }
    return await memoryStore.adminUpdateReportStatus(reportId, newStatus);
  },

  async adminGetAllReviews(options = {}) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      const { page = 1, limit = 20 } = options;
      const [data, total] = await Promise.all([
        prisma.review.findMany({
          include: {
            tenant: { select: { id: true, name: true } },
            kos: { select: { id: true, nama: true, kota: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.review.count()
      ]);
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }
    return await memoryStore.adminGetAllReviews(options);
  },

  async adminDeleteReview(reviewId) {
    const { isPostgres } = await getDatabaseStatus();
    if (isPostgres) {
      return await prisma.review.delete({ where: { id: reviewId } });
    }
    return await memoryStore.adminDeleteReview(reviewId);
  },

  // ================= PAYMENT METHODS =================

  async createPayment(params) {
    // Payment belum ada di schema Prisma; selalu gunakan memoryStore
    return await memoryStore.createPayment(params);
  },

  async getPaymentByBookingId(bookingId, userId) {
    return await memoryStore.getPaymentByBookingId(bookingId, userId);
  },

  async getPaymentsByTenantId(tenantId) {
    return await memoryStore.getPaymentsByTenantId(tenantId);
  },

  async getPaymentsByOwnerId(ownerId) {
    return await memoryStore.getPaymentsByOwnerId(ownerId);
  },

  async processPaymentConfirmation(paymentId, ownerId, action, alasanPenolakan) {
    return await memoryStore.processPaymentConfirmation(paymentId, ownerId, action, alasanPenolakan);
  },

  async getOwnerFinancialSummary(ownerId) {
    return await memoryStore.getOwnerFinancialSummary(ownerId);
  },

  // ================= LANDMARK & FACILITY METADATA (PHASE 13) =================
  async getCampusLandmarks() {
    return await memoryStore.getCampusLandmarks();
  },

  async getFacilityMetadata() {
    return await memoryStore.getFacilityMetadata();
  },

  // ================= ROOM AVAILABILITY & RENTAL EXTENSION (PHASE 14) =================
  async requestBookingExtension(bookingId, tenantId, durasiBulan, catatan) {
    return await memoryStore.requestBookingExtension(bookingId, tenantId, durasiBulan, catatan);
  },

  async processExtensionApproval(bookingId, ownerId, action, alasanPenolakan) {
    return await memoryStore.processExtensionApproval(bookingId, ownerId, action, alasanPenolakan);
  },

  async getRoomAvailabilitySchedule(kosId) {
    return await memoryStore.getRoomAvailabilitySchedule(kosId);
  },

  async getExpiringRentals(userId, role) {
    return await memoryStore.getExpiringRentals(userId, role);
  },

  // ================= DIGITAL RENTAL AGREEMENT & INVOICE (PHASE 15) =================
  async getOrCreateAgreement(bookingId, userId) {
    return await memoryStore.getOrCreateAgreement(bookingId, userId);
  },

  async signAgreement(bookingId, userId, role, signatureName, ipAddress) {
    return await memoryStore.signAgreement(bookingId, userId, role, signatureName, ipAddress);
  },

  async getInvoiceAndReceipt(bookingId, userId) {
    return await memoryStore.getInvoiceAndReceipt(bookingId, userId);
  }
};


export default db;
