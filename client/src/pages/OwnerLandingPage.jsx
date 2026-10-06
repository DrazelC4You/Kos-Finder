import React from 'react';
import { Link } from 'react-router-dom';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import {
  ArrowRight, Building2, BedDouble, CalendarCheck, Wallet, MessageSquare, ImagePlus
} from 'lucide-react';

// Fakta kemampuan produk. Ikon garis tipis hanya menandai baris — tanpa tile
// berlatar dan tanpa kartu statistik fiktif ("44%+ okupansi", "Rating 4.8/5").
const FEATURES = [
  {
    icon: Building2,
    title: 'Kelola Multi-Properti',
    desc: 'Daftarkan lebih dari satu properti kos dan kelola seluruhnya dari satu dasbor terpadu.',
  },
  {
    icon: BedDouble,
    title: 'Manajemen Kamar',
    desc: 'Atur nomor kamar, harga per kamar, dan status ketersediaan (kosong, terisi, maintenance) secara real-time.',
  },
  {
    icon: CalendarCheck,
    title: 'Persetujuan Booking',
    desc: 'Terima notifikasi pengajuan sewa masuk, tinjau profil penyewa, lalu setujui atau tolak dengan satu klik.',
  },
  {
    icon: Wallet,
    title: 'Pembayaran & Keuangan',
    desc: 'Verifikasi bukti pembayaran penyewa dan pantau ringkasan pendapatan bulanan dari kamar yang terisi.',
  },
  {
    icon: MessageSquare,
    title: 'Chat Penyewa',
    desc: 'Balas pertanyaan calon penyewa langsung dari platform tanpa berpindah ke aplikasi lain.',
  },
  {
    icon: ImagePlus,
    title: 'Galeri Foto Properti',
    desc: 'Unggah hingga 8 foto per properti, tentukan foto utama, dan tampilkan hunian Anda secara menarik.',
  },
];

const STEPS = [
  {
    step: '01',
    title: 'Daftar sebagai Pemilik',
    desc: 'Buat akun dengan peran Pemilik Kos. Prosesnya kurang dari dua menit dan tanpa biaya pendaftaran.',
  },
  {
    step: '02',
    title: 'Lengkapi Listing Properti',
    desc: 'Isi nama kos, alamat, harga, fasilitas, aturan, dan unggah foto properti agar tampil meyakinkan.',
  },
  {
    step: '03',
    title: 'Verifikasi & Tayang',
    desc: 'Tim admin memoderasi listing Anda. Setelah terverifikasi, properti tampil di hasil pencarian publik.',
  },
  {
    step: '04',
    title: 'Terima Penyewa',
    desc: 'Kelola pengajuan booking, konfirmasi pembayaran, dan pantau okupansi kamar dari dasbor pemilik.',
  },
];

const Kicker = ({ children }) => (
  <p className="flex items-center gap-3 text-sm font-medium text-emerald-700 mb-5">
    <span className="h-px w-8 bg-emerald-600 flex-shrink-0" aria-hidden="true" />
    {children}
  </p>
);

export default function OwnerLandingPage() {
  useDocumentTitle('Untuk Pemilik Kos');
  return (
    <div className="bg-slate-50">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <Kicker>Untuk Pemilik Properti</Kicker>
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-balance text-slate-900 max-w-[20ch] mb-6">
            Kelola Kos Lebih Mudah dengan Singgah.
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl mb-9">
            Pasarkan properti Anda ke pencari kos di seluruh Indonesia, kelola kamar dan booking dalam
            satu dasbor, dan terima pembayaran terverifikasi — tanpa spreadsheet, tanpa ribet.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <Link
              to="/register?role=OWNER"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              Daftarkan Kos
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:underline"
            >
              <span className="font-medium">Masuk ke Dasbor Pemilik</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Fitur ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <Kicker>Fitur Dasbor</Kicker>
        <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-balance text-slate-900 max-w-[24ch] mb-10">
          Semua yang Anda Butuhkan untuk Mengelola Kos
        </h2>
        <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-9">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="border-t border-slate-200 pt-5">
                <Icon className="w-5 h-5 text-emerald-700 mb-4" strokeWidth={1.25} aria-hidden="true" />
                <dt className="text-base font-semibold text-slate-900 mb-2">{f.title}</dt>
                <dd className="text-sm text-slate-500 leading-relaxed">{f.desc}</dd>
              </div>
            );
          })}
        </dl>
      </section>

      {/* ── Langkah ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <Kicker>Alur Onboarding</Kicker>
          <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-balance text-slate-900 mb-10">
            Mulai dalam 4 Langkah
          </h2>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-9">
            {STEPS.map((s) => (
              <li key={s.step} className="border-t-2 border-slate-900/85 pt-5">
                <h3 className="text-base font-semibold text-slate-900 mb-2">
                  <span className="text-emerald-700 tabular-nums mr-2">{s.step}</span>
                  {s.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <div className="border border-slate-200 bg-white p-8 sm:p-12">
          <Kicker>Pasang Properti Anda</Kicker>
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance text-slate-900 max-w-[20ch] mb-4">
            Properti Anda, Penghuni Baru Anda
          </h2>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mb-8">
            Daftarkan properti kos Anda di Singgah dan biarkan kamar kosong Anda ditemukan calon penghuni yang sedang mencari.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
            <Link
              to="/register?role=OWNER"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
            >
              Daftarkan Kos Sekarang
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
            <Link
              to="/tentang"
              className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:underline"
            >
              <span className="font-medium">Pelajari cara Singgah bekerja</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
