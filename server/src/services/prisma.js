import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Cegah instansiasi ganda Prisma Client saat hot reload di development
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['warn', 'error']
    });
  }
  prisma = global.prisma;
}

/**
 * Helper untuk menguji apakah koneksi database PostgreSQL aktif
 */
export const checkDatabaseConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true, message: 'Terhubung ke PostgreSQL' };
  } catch (error) {
    return { connected: false, message: error.message };
  }
};

export default prisma;
