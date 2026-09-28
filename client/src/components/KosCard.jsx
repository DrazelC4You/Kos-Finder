import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Heart, CheckCircle2, Bed } from 'lucide-react';

export const formatRupiah = (amount) => {
  return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
};

export default function KosCard({ kos, isFavorited = false, onToggleFavorite }) {
  if (!kos) return null;

  const typeColorMap = {
    PUTRA: 'bg-blue-600 text-white',
    PUTRI: 'bg-pink-600 text-white',
    CAMPUR: 'bg-indigo-600 text-white'
  };

  const isAvail = (kos.kamarTersedia || 0) > 0;
  const mainPhoto = kos.foto && kos.foto.length > 0
    ? kos.foto[0]
    : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60';

  const visibleFacs = (kos.fasilitas || []).slice(0, 3);
  const remainingFacs = (kos.fasilitas || []).length - visibleFacs.length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group">
      {/* Media Image */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-100">
        <img
          src={mainPhoto}
          alt={kos.nama}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=60';
          }}
        />

        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${typeColorMap[kos.type] || 'bg-slate-700 text-white'}`}>
            {kos.type || 'Campur'}
          </span>
          {kos.isVerified && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>Terverifikasi</span>
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onToggleFavorite) onToggleFavorite(kos.id);
          }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 shadow-md transition-all"
          title={isFavorited ? 'Hapus dari favorit' : 'Simpan ke favorit'}
        >
          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Room Availability Pill */}
        <div className="absolute bottom-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg backdrop-blur-md shadow-sm flex items-center gap-1.5 ${
            isAvail ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
          }`}>
            <Bed className="w-3.5 h-3.5" />
            <span>{isAvail ? `${kos.kamarTersedia} kamar tersedia` : 'Kamar penuh'}</span>
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{kos.kota}</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{kos.rating ? Number(kos.rating).toFixed(1) : '4.5'}</span>
            <span className="text-slate-400 font-normal">({kos.jumlahReview || 0})</span>
          </span>
        </div>

        <h3 className="font-heading font-bold text-slate-900 text-base mb-2 line-clamp-1 group-hover:text-emerald-600 transition-colors">
          {kos.nama}
        </h3>

        {/* Facilities Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {visibleFacs.map((fac, idx) => (
            <span key={idx} className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
              {fac}
            </span>
          ))}
          {remainingFacs > 0 && (
            <span className="text-[11px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">
              +{remainingFacs}
            </span>
          )}
        </div>

        {/* Card Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-emerald-700 font-bold font-heading text-lg leading-tight">
              {formatRupiah(kos.hargaBulanan)}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">/ bulan</span>
          </div>

          <Link
            to={`/kos/${kos.id}`}
            className="text-xs font-semibold px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-all shadow-sm"
          >
            Lihat Detail
          </Link>
        </div>
      </div>
    </div>
  );
}
