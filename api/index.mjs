// Entry serverless untuk Vercel. Semua request /api/* dan /uploads/* diarahkan
// ke fungsi ini oleh rewrites di vercel.json, dengan PATH ASLI tetap utuh,
// sehingga instance Express yang sama (server/src/app.js) menangani routing
// persis seperti di lokal/Render. server.js tidak dipakai di Vercel.
import app from '../server/src/app.js';

export default function handler(req, res) {
  return app(req, res);
}
