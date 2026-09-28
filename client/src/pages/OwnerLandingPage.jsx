import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building, BedDouble, CalendarCheck, Wallet, MessageSquare,
  Star, ArrowRight, CheckCircle2, BarChart3, Shield, ImagePlus
} from 'lucide-react';

const FEATURES = [
  {
    icon: Building,
    title: 'Kelola Multi-Properti',
    desc: 'Daftarkan lebih dari satu properti kos dan kelola seluruhnya dari satu dasbor terpadu.'
  },
  {
    icon: BedDouble,
    title: 'Manajemen Kamar',
    desc: 'Atur nomor kamar, harga per kamar, dan status ketersediaan (kosong, terisi, maintenance) secara real-time.'
  },
  {
    icon: CalendarCheck,
    title: 'Persetujuan Booking',
    desc: 'Terima notifikasi pengajuan sewa masuk, tinjau profil penyewa, lalu setujui atau tolak dengan satu klik.'
  },
  {
    icon: Wallet,
    title: 'Pembayaran & Keuangan',
    desc: 'Verifikasi bukti pembayaran penyewa dan pantau ringkasan pendapatan bulanan dari kamar yang terisi.'
  },
  {
    icon: MessageSquare,
    title: 'Chat Penyewa',
    desc: 'Balas pertanyaan calon penyewa langsung dari platform tanpa berpindah ke aplikasi lain.'
  },
  {
    icon: ImagePlus,
    title: 'Galeri Foto Properti',
    desc: 'Unggah hingga 8 foto per properti, tentukan foto utama, dan tampilkan hunian Anda secara menarik.'
  }
];

const STEPS = [
  {
    step: '01',
    title: 'Daftar sebagai Pemilik',
    desc: 'Buat akun dengan peran Pemilik Kos. Prosesnya kurang dari dua menit dan tanpa biaya pendaftaran.'
  },
  {
    step: '02',
    title: 'Lengkapi Listing Properti',
    desc: 'Isi nama kos, alamat, harga, fasilitas, aturan, dan unggah foto properti agar tampil meyakinkan.'
  },
  {
    step: '03',
    title: 'Verifikasi & Tayang',
    desc: 'Tim admin memoderasi listing Anda. Setelah terverifikasi, properti tampil di hasil pencarian publik.'
  },
  {
    step: '04',
    title: 'Terima Penyewa',
    desc: 'Kelola pengajuan booking, konfirmasi pembayaran, dan pantau okupansi kamar dari dasbor pemilik.'
  }
];

export default function OwnerLandingPage() {
  return (
    <div className="bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-5">
              <Building className="w-3.5 h-3.5" />
              Untuk Pemilik Properti
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading leading-tight mb-4">
              Kelola Kos Lebih Mudah dengan KosFinder.
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-7 max-w-lg">
              Pasarkan properti Anda ke ribuan pencari kos, kelola kamar dan booking dalam satu dasbor,
              dan terima pembayaran terverifikasi — tanpa spreadsheet, tanpa ribet.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register?role=OWNER"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
              >
                Daftarkan Kos
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 text-white text-sm font-semibold rounded-xl border border-white/20 transition-colors"
              >
                Masuk ke Dasbor Pemilik
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: BarChart3, value: '44%+', label: 'Rata-rata okupansi terpantau' },
              { icon: CalendarCheck, value: '1 Klik', label: 'Setujui pengajuan sewa' },
              { icon: Shield, value: 'Verified', label: 'Listing dimoderasi admin' },
              { icon: Star, value: '4.8/5', label: 'Rating rata-rata platform' }
            ].map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur rounded-2xl border border-white/10 p-5">
                <s.icon className="w-5 h-5 text-emerald-400 mb-2.5" />
                <div className="text-xl font-extrabold font-heading">{s.value}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-slate-900 font-heading mb-2">Semua yang Anda Butuhkan untuk Mengelola Kos</h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Fitur lengkap yang dirancang khusus untuk operasional harian pemilik kos, dari listing hingga laporan keuangan.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:border-emerald-200 transition-all">
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3.5">
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{f.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Langkah */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-slate-900 font-heading text-center mb-10">Mulai dalam 4 Langkah</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.step} className="relative bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <span className="text-4xl font-extrabold text-emerald-600/20 font-heading absolute top-4 right-5">{s.step}</span>
                <h3 className="text-sm font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl px-8 py-12 text-center text-white shadow-lg shadow-emerald-600/20">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-4 text-emerald-100" />
          <h2 className="text-2xl font-bold font-heading mb-3">Properti Anda, Penghuni Baru Anda</h2>
          <p className="text-sm text-emerald-50/90 max-w-xl mx-auto mb-7">
            Bergabunglah dengan pemilik kos lainnya di KosFinder dan biarkan kamar kosong Anda terisi lebih cepat.
          </p>
          <Link
            to="/register?role=OWNER"
            className="inline-flex items-center gap-2 px-7 py-3 bg-white text-emerald-700 text-sm font-bold rounded-xl hover:bg-emerald-50 transition-colors shadow-md"
          >
            Daftarkan Kos Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
