import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Storage Abstraction Layer (Section 3 & 29)
 * Mengabstraksi penyimpanan file agar mudah diganti dengan cloud storage
 * (S3 / Cloudinary) di production tanpa mengubah controller.
 *
 * Konfigurasi via environment:
 *   STORAGE_DRIVER=local | (s3/cloudinary di masa depan)
 *   UPLOAD_DIR=uploads   (relatif terhadap folder server)
 *   PUBLIC_BASE_URL=http://localhost:5000 (opsional, untuk URL absolut)
 */

const STORAGE_DRIVER = process.env.STORAGE_DRIVER || 'local';
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const uploadRoot = path.resolve(__dirname, '../../', UPLOAD_DIR);

// Pastikan folder penyimpanan lokal tersedia saat boot
if (STORAGE_DRIVER === 'local' && !fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

class LocalStorageProvider {
  constructor() {
    this.root = uploadRoot;
  }

  getRoot() {
    return this.root;
  }

  toPublicUrl(filename) {
    const base = process.env.PUBLIC_BASE_URL || '';
    return `${base}/uploads/${filename}`;
  }

  async delete(filename) {
    if (!filename) return;
    const safeName = path.basename(filename); // cegah path traversal
    const full = path.join(this.root, safeName);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
}

const providers = {
  local: () => new LocalStorageProvider()
  // s3: () => new S3StorageProvider()      <- implementasi masa depan
  // cloudinary: () => new CloudinaryProvider()
};

if (!providers[STORAGE_DRIVER]) {
  throw new Error(`STORAGE_DRIVER tidak dikenal: ${STORAGE_DRIVER}`);
}

const storage = providers[STORAGE_DRIVER]();

export default storage;
