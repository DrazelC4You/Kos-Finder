import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search } from 'lucide-react';

// Nilai inti. Hanya judul + penjelasan faktual; ikon, gradien, dan label CTA
// dekoratif sengaja tidak dipakai karena tidak menyampaikan informasi.
const VALUES = [
  {
    title: 'Listing Terverifikasi',
    desc: 'Setiap properti kos melewati proses verifikasi oleh tim admin sebelum tampil publik, sehingga pencari kos terhindar dari iklan palsu.',
  },
  {
    title: 'Komunikasi Langsung',
    desc: 'Chat terintegrasi antara pencari kos dan pemilik memudahkan tanya-jawab seputar kamar, harga, dan aturan sebelum mengajukan sewa.',
  },
  {
    title: 'Ulasan Transparan',
    desc: 'Rating dan ulasan berasal dari penyewa asli yang pernah mengajukan booking, memberikan gambaran jujur kondisi kos.',
  },
  {
    title: 'Tanpa Biaya Tersembunyi',
    desc: 'Harga yang tampil adalah harga sewa per bulan dari pemilik. Pengajuan sewa dilakukan langsung di dalam platform.',
  },
];

const STEPS = [
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
];

export default function AboutPage() {
  return (
    <div className="bg-slate-50">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
          <p className="flex items-center gap-3 text-sm font-medium text-emerald-700 mb-5">
            <span className="h-px w-8 bg-emerald-600" aria-hidden="true" />
            Tentang KosFinder
          </p>
          <h1 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.15] text-balance text-slate-900 max-w-[22ch] mb-6">
            Mempertemukan Pencari Kos dan Pemilik Properti yang Tepat
          </h1>
          <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-2xl">
            KosFinder adalah platform pencarian dan pengelolaan kos yang menghubungkan pencari hunian
            dengan pemilik properti terverifikasi — mulai dari pencarian, chat, pengajuan sewa,
            hingga ulasan penghuni, semuanya dalam satu aplikasi.
          </p>
        </div>
      </section>

      {/* ── Misi Kami ─────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">

          <div className="lg:col-span-5">
            <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-balance text-slate-900 mb-5">
              Misi Kami
            </h2>
            <p className="text-base text-slate-600 leading-relaxed mb-4">
              Mencari kos yang cocok sering kali melelahkan: informasi tersebar, foto tidak sesuai kenyataan,
              dan komunikasi dengan pemilik berbelit. Di sisi lain, pemilik kos kesulitan memasarkan
              propertinya secara rapi dan mengelola okupansi kamar.
            </p>
            <p className="text-base text-slate-600 leading-relaxed mb-8">
              KosFinder hadir untuk menyelesaikan kedua sisi masalah tersebut. Pencari kos mendapatkan
              listing terverifikasi lengkap dengan fasilitas, harga, peta lokasi, dan ulasan penghuni.
              Pemilik kos mendapatkan dasbor pengelolaan properti, kamar, booking, dan keuangan
              dalam satu tempat.
            </p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
              <Link
                to="/cari"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                Mulai Cari Kos
              </Link>
              <Link
                to="/untuk-pemilik"
                className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 whitespace-nowrap focus-visible:outline-none focus-visible:underline"
              >
                <span className="font-medium">Untuk Pemilik Kos</span>
                <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <dl className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
              {VALUES.map((v) => (
                <div key={v.title} className="border-t border-slate-200 pt-5">
                  <dt className="text-base font-semibold text-slate-900 mb-2">{v.title}</dt>
                  <dd className="text-sm text-slate-500 leading-relaxed">{v.desc}</dd>
                </div>
              ))}
            </dl>
          </div>

        </div>
      </section>

      {/* ── Cara Kerja ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-y border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
          <h2 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-balance text-slate-900 mb-10">
            Bagaimana KosFinder Bekerja
          </h2>
          <ol className="grid md:grid-cols-3 gap-x-10 gap-y-8">
            {STEPS.map((s) => (
              <li key={s.step} className="border-t border-slate-200 pt-5">
                <span className="block text-xs font-semibold text-emerald-700 tracking-wider mb-2">{s.step}</span>
                <h3 className="text-base font-semibold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16 sm:py-20 lg:py-24">
        <h2 className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-balance text-slate-900 max-w-[20ch] mb-4">
          Siap Menemukan Hunian yang Tepat?
        </h2>
        <p className="text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mb-8">
          Daftar gratis sebagai pencari kos atau pemilik properti dan rasakan pengalaman mengelola hunian yang modern.
        </p>
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2"
        >
          Daftar Sekarang
          <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
        </Link>
      </section>

    </div>
  );
}
