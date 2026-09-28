import db from '../services/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * GET ALL KOS (LISTING DENGAN FILTER, SORTING & PAGINATION)
 * GET /api/kos
 */
export const getAllKos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      kota,
      type,
      minPrice,
      maxPrice,
      minRating,
      facilities,
      rules,
      campus,
      landmark,
      sort = 'newest',
      availableOnly
    } = req.query;

    const parsedFacilities = facilities ? (Array.isArray(facilities) ? facilities : facilities.split(',')) : [];
    const parsedRules = rules ? (Array.isArray(rules) ? rules : rules.split(',')) : [];

    const result = await db.getAllKos({
      page: Number(page),
      limit: Number(limit),
      search,
      kota,
      type,
      minPrice,
      maxPrice,
      minRating,
      facilities: parsedFacilities,
      rules: parsedRules,
      campus,
      landmark,
      sort,
      availableOnly: availableOnly === 'true' || availableOnly === true,
      status: 'ACTIVE'
    });

    return successResponse(res, result.data, 'Daftar kos berhasil dimuat.', 200, {
      pagination: result.pagination
    });
  } catch (err) {
    console.error('Error getAllKos:', err);
    return errorResponse(res, 'Gagal memuat daftar kos.', 500);
  }
};

/**
 * GET CAMPUS & LANDMARKS (PHASE 13)
 * GET /api/kos/landmarks
 */
export const getCampusLandmarks = async (req, res) => {
  try {
    const landmarks = await db.getCampusLandmarks();
    return successResponse(res, landmarks, 'Daftar kampus dan landmark berhasil dimuat.');
  } catch (err) {
    console.error('Error getCampusLandmarks:', err);
    return errorResponse(res, 'Gagal memuat daftar landmark.', 500);
  }
};

/**
 * GET CATEGORIZED FACILITIES METADATA (PHASE 13)
 * GET /api/kos/facilities/categories
 */
export const getFacilityCategories = async (req, res) => {
  try {
    const metadata = await db.getFacilityMetadata();
    return successResponse(res, metadata, 'Metadata fasilitas dan aturan berhasil dimuat.');
  } catch (err) {
    console.error('Error getFacilityCategories:', err);
    return errorResponse(res, 'Gagal memuat kategori fasilitas.', 500);
  }
};

/**
 * GET KOS DETAIL
 * GET /api/kos/:id
 */
export const getKosDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const kos = await db.getKosById(id);

    if (!kos) {
      return errorResponse(res, 'Data kos tidak ditemukan.', 404);
    }

    return successResponse(res, kos, 'Detail kos berhasil dimuat.');
  } catch (err) {
    console.error('Error getKosDetail:', err);
    return errorResponse(res, 'Gagal memuat detail kos.', 500);
  }
};

/**
 * CREATE KOS (KHUSUS OWNER & ADMIN)
 * POST /api/kos
 */
export const createKos = async (req, res) => {
  try {
    const {
      nama,
      deskripsi,
      alamat,
      kota,
      hargaBulanan,
      type = 'CAMPUR',
      totalKamar = 4,
      fasilitas = [],
      foto = [],
      aturan = '',
      latitude,
      longitude
    } = req.body;

    // 1. Validasi field wajib
    if (!nama || !alamat || !kota || !hargaBulanan) {
      return errorResponse(res, 'Nama kos, alamat, kota, dan harga bulanan wajib diisi.', 400);
    }

    if (Number(hargaBulanan) <= 0) {
      return errorResponse(res, 'Harga bulanan harus bernilai lebih dari 0.', 400);
    }

    // Default foto jika kosong
    const defaultPhotos = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=60'
    ];

    const finalPhotos = Array.isArray(foto) && foto.length > 0 ? foto : defaultPhotos;

    // 2. Simpan ke database
    const newKos = await db.createKos({
      ownerId: req.user.id,
      nama: nama.trim(),
      deskripsi: deskripsi || 'Kos nyaman dan strategis.',
      alamat: alamat.trim(),
      kota: kota.trim(),
      latitude: latitude ? Number(latitude) : null,
      longitude: longitude ? Number(longitude) : null,
      hargaBulanan: Number(hargaBulanan),
      type: type.toUpperCase(),
      foto: finalPhotos,
      fasilitas: Array.isArray(fasilitas) ? fasilitas : [],
      aturan: aturan || '',
      totalKamar: Number(totalKamar) || 4
    });

    return successResponse(res, newKos, 'Properti kos berhasil didaftarkan!', 201);
  } catch (err) {
    console.error('Error createKos:', err);
    return errorResponse(res, 'Gagal mendaftarkan kos baru.', 500);
  }
};

/**
 * UPDATE KOS
 * PUT /api/kos/:id
 */
export const updateKos = async (req, res) => {
  try {
    const { id } = req.params;
    const existingKos = await db.getKosById(id);

    if (!existingKos) {
      return errorResponse(res, 'Kos yang akan diperbarui tidak ditemukan.', 404);
    }

    // Validasi izin kepemilikan: Hanya pemilik kos atau ADMIN yang boleh mengedit
    if (existingKos.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Anda tidak memiliki izin untuk mengubah properti kos milik pengguna lain.', 403);
    }

    const updated = await db.updateKos(id, req.body);
    return successResponse(res, updated, 'Data kos berhasil diperbarui.');
  } catch (err) {
    console.error('Error updateKos:', err);
    return errorResponse(res, 'Gagal memperbarui data kos.', 500);
  }
};

/**
 * DELETE KOS
 * DELETE /api/kos/:id
 */
export const deleteKos = async (req, res) => {
  try {
    const { id } = req.params;
    const existingKos = await db.getKosById(id);

    if (!existingKos) {
      return errorResponse(res, 'Kos yang akan dihapus tidak ditemukan.', 404);
    }

    // Validasi izin kepemilikan
    if (existingKos.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Anda tidak memiliki izin untuk menghapus properti kos ini.', 403);
    }

    await db.deleteKos(id);
    return successResponse(res, null, 'Data kos berhasil dihapus.');
  } catch (err) {
    console.error('Error deleteKos:', err);
    return errorResponse(res, 'Gagal menghapus properti kos.', 500);
  }
};

/**
 * GET KOS ROOM AVAILABILITY & TIMELINE
 * GET /api/kos/:id/availability
 */
export const getKosAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await db.getRoomAvailabilitySchedule(id);
    return successResponse(res, schedule, 'Jadwal ketersediaan kamar kos berhasil dimuat.');
  } catch (err) {
    console.error('Error getKosAvailability:', err);
    return errorResponse(res, err.message || 'Gagal memuat jadwal ketersediaan kamar.', 404);
  }
};

