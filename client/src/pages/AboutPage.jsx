import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home, Search, ShieldCheck, MessageCircle, Star, MapPin,
  CheckCircle2, Users, Building, ArrowRight, CircleDollarSign
} from 'lucide-react';
import { GradientCard } from '../components/GradientCard.jsx';

// ─── Feature card definitions ──────────────────────────────────────────────────
const VALUES = [
  {
    icon: ShieldCheck,
    title: 'Listing Terverifikasi',
    desc: 'Setiap properti kos melewati proses verifikasi oleh tim admin sebelum tampil publik, sehingga pencari kos terhindar dari iklan palsu.',
    decorative: 'shield',
    // Soft emerald / mint gradient
    gradient: 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100',
    accentColor: 'text-emerald-600',
    iconBg: 'bg-emerald-100',
    borderColor: 'border-emerald-200/70',
    cta: 'Lihat Semua Listing',
  },
  {
    icon: MessageCircle,
    title: 'Komunikasi Langsung',
    desc: 'Chat terintegrasi antara pencari kos dan pemilik memudahkan tanya-jawab seputar kamar, harga, dan aturan sebelum mengajukan sewa.',
    decorative: 'chat',
    // Soft teal / blue-green gradient
    gradient: 'bg-gradient-to-br from-teal-50 via-cyan-50 to-sky-100/60',
    accentColor: 'text-teal-600',
    iconBg: 'bg-teal-100',
    borderColor: 'border-teal-200/70',
    cta: 'Mulai Chat',
  },
  {
    icon: Star,
    title: 'Ulasan Transparan',
    desc: 'Rating dan ulasan berasal dari penyewa asli yang pernah mengajukan booking, memberikan gambaran jujur kondisi kos.',
    decorative: 'star',
    // Soft green / warm neutral gradient
    gradient: 'bg-gradient-to-br from-green-50 via-emerald-50/80 to-slate-100/60',
    accentColor: 'text-emerald-700',
    iconBg: 'bg-green-100',
    borderColor: 'border-green-200/70',
    cta: 'Lihat Ulasan',
  },
  {
    icon: CircleDollarSign,
    title: 'Tanpa Biaya Tersembunyi',
    desc: 'Harga yang tampil adalah harga sewa per bulan dari pemilik. Pengajuan sewa dilakukan langsung di dalam platform.',
    decorative: 'price',
    // Soft mint / emerald gradient
    gradient: 'bg-gradient-to-br from-emerald-50/90 via-teal-50 to-cyan-50/80',
    accentColor: 'text-teal-700',
    iconBg: 'bg-teal-100/80',
    borderColor: 'border-teal-200/60',
    cta: 'Pelajari Cara Kerja',
  },
];

// ─── Stats row ─────────────────────────────────────────────────────────────────
const STATS = [
  { icon: Building, value: '12+', label: 'Properti Terdaftar' },
  { icon: MapPin, value: '9', label: 'Kota Jangkauan' },
  { icon: Users, value: '3 Peran', label: 'Pencari, Pemilik, Admin' },
  { icon: CheckCircle2, value: '100%', label: 'Listing Dimoderasi' },
];

export default function AboutPage() {
  return (
    <div className="bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs font-semibold mb-5">
            <Home className="w-3.5 h-3.5" />
            Tentang KosFinder
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading leading-tight mb-4">
            Mempertemukan Pencari Kos dan<br className="hidden sm:block" /> Pemilik Properti yang Tepat
          </h1>
          <p className="text-emerald-50/90 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            KosFinder adalah platform pencarian dan pengelolaan kos yang menghubungkan pencari hunian
            dengan pemilik properti terverifikasi — mulai dari pencarian, chat, pengajuan sewa,
            hingga ulasan penghuni, semuanya dalam satu aplikasi.
          </p>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2.5">
                <s.icon className="w-5 h-5" />
              </div>
              <div className="text-xl font-extrabold text-slate-900 font-heading">{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Misi Kami ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* LEFT: copy & CTAs */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 font-heading mb-4">Misi Kami</h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Mencari kos yang cocok sering kali melelahkan: informasi tersebar, foto tidak sesuai kenyataan,
              dan komunikasi dengan pemilik berbelit. Di sisi lain, pemilik kos kesulitan memasarkan
              propertinya secara rapi dan mengelola okupansi kamar.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              KosFinder hadir untuk menyelesaikan kedua sisi masalah tersebut. Pencari kos mendapatkan
              listing terverifikasi lengkap dengan fasilitas, harga, peta lokasi, dan ulasan penghuni.
              Pemilik kos mendapatkan dasbor pengelolaan properti, kamar, booking, dan keuangan
              dalam satu tempat.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/cari"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
              >
                <Search className="w-4 h-4" />
                Mulai Cari Kos
              </Link>
              <Link
                to="/untuk-pemilik"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                Untuk Pemilik Kos
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* RIGHT: 2×2 gradient-card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {VALUES.map((v) => (
              <GradientCard
                key={v.title}
                icon={v.icon}
                title={v.title}
                description={v.desc}
                decorative={v.decorative}
                gradient={v.gradient}
                accentColor={v.accentColor}
                iconBg={v.iconBg}
                borderColor={v.borderColor}
                cta={v.cta}
              />
            ))}
          </div>

        </div>
      </section>

      {/* ── Cara Kerja Singkat ────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl font-bold text-slate-900 font-heading text-center mb-10">
            Bagaimana KosFinder Bekerja
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Cari & Bandingkan',
                desc: 'Gunakan filter kota, harga, tipe kos, dan fasilitas untuk menemukan hunian yang paling sesuai kebutuhan dan bujet Anda.',
              },
              {
                step: '02',
                title: 'Chat & Ajukan Sewa',
                desc: 'Diskusikan detail dengan pemilik melalui chat terintegrasi, lalu ajukan booking kamar langsung dari halaman detail kos.',
              },
              {
                step: '03',
                title: 'Huni & Beri Ulasan',
                desc: 'Setelah pengajuan disetujui pemilik, kamar menjadi milik Anda. Bagikan pengalaman melalui ulasan untuk membantu pencari berikutnya.',
              },
            ].map((s) => (
              <div key={s.step} className="relative bg-slate-50 rounded-2xl border border-slate-200 p-6">
                <span className="text-4xl font-extrabold text-emerald-600/20 font-heading absolute top-4 right-5">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-slate-900 font-heading mb-3">
          Siap Menemukan Hunian yang Tepat?
        </h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xl mx-auto">
          Daftar gratis sebagai pencari kos atau pemilik properti dan rasakan pengalaman mengelola hunian yang modern.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          Daftar Sekarang
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

    </div>
  );
}
