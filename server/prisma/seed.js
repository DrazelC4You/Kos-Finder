import { PrismaClient } from '@prisma/client';
import { seedUsers, seedKos, seedBookings, seedReviews } from './seedData.js';

const prisma = new PrismaClient();

export async function runSeed() {
  console.log('🌱 Memulai proses Seeding database KosFinder...');

  // 1. Bersihkan database terlebih dahulu
  console.log('🧹 Membersihkan tabel lama...');
  await prisma.message.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.favorite.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.kos.deleteMany({});
  await prisma.profile.deleteMany({});
  await prisma.user.deleteMany({});

  // 2. Masukkan Users & Profiles
  console.log('👤 Mengisi data Users & Profiles...');
  for (const u of seedUsers) {
    const { profile, ...userData } = u;
    await prisma.user.create({
      data: {
        ...userData,
        profile: {
          create: profile
        }
      }
    });
  }
  console.log(`✅ ${seedUsers.length} Users & Profiles berhasil dibuat.`);

  // 3. Masukkan Kos & Kamar
  console.log('🏢 Mengisi data Kos & Kamar...');
  for (const k of seedKos) {
    const { rooms, ...kosData } = k;
    await prisma.kos.create({
      data: {
        ...kosData,
        rooms: {
          create: rooms
        }
      }
    });
  }
  console.log(`✅ ${seedKos.length} Properti Kos berhasil dibuat.`);

  // 4. Masukkan Bookings
  console.log('📅 Mengisi data Bookings...');
  for (const b of seedBookings) {
    await prisma.booking.create({
      data: b
    });
  }
  console.log(`✅ ${seedBookings.length} Bookings berhasil dibuat.`);

  // 5. Masukkan Reviews
  console.log('⭐ Mengisi data Reviews...');
  for (const r of seedReviews) {
    await prisma.review.create({
      data: r
    });
  }
  console.log(`✅ ${seedReviews.length} Reviews berhasil dibuat.`);

  console.log('✨ SEEDING DATABASE SELESAI DENGAN SUKSES! ✨');
}

// Hanya jalankan sebagai script CLI (node prisma/seed.js), bukan saat di-import
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .catch((e) => {
      console.error('❌ Gagal saat seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
