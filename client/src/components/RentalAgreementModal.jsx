import React, { useState, useEffect } from 'react';
import {
  FileText, CheckCircle2, ShieldCheck, Printer, XCircle,
  Loader2, PenTool, UserCheck, AlertTriangle, Building2, MapPin
} from 'lucide-react';
import api from '../services/api.js';
import { formatRupiah } from './KosCard.jsx';

export default function RentalAgreementModal({ bookingId, currentUser, onClose, onSigned }) {
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signatureName, setSignatureName] = useState(currentUser?.name || '');
  const [error, setError] = useState('');

  const fetchAgreement = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/agreements/${bookingId}`);
      if (res.data.success) {
        setAgreement(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memuat Surat Perjanjian Sewa.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchAgreement();
    }
  }, [bookingId]);

  const handleSign = async (e) => {
    e.preventDefault();
    if (!signatureName.trim()) return;

    try {
      setSigning(true);
      setError('');
      const res = await api.post(`/agreements/${bookingId}/sign`, {
        signatureName: signatureName.trim()
      });
      if (res.data.success) {
        setAgreement(res.data.data);
        if (onSigned) onSigned(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menandatangani dokumen perjanjian.');
    } finally {
      setSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!bookingId) return null;

  const isTenant = agreement?.pihakKedua?.id === currentUser?.id;
  const isOwner = agreement?.pihakPertama?.id === currentUser?.id || currentUser?.role === 'OWNER';
  const hasUserSigned = isTenant ? agreement?.signatures?.tenant?.signed : agreement?.signatures?.owner?.signed;
  const isFullySigned = agreement?.status === 'OFFICIALLY_SIGNED';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                Surat Perjanjian Sewa Kos (SPK)
              </h3>
              <p className="text-[11px] text-slate-500">
                Dokumen Hukum Resmi Antara Pemilik dan Penyewa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors print:hidden"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors print:hidden"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Document Content */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 print:p-0 print:text-black">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs">Menyiapkan dokumen perjanjian sewa resmi...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : agreement ? (
            <div id="printable-agreement" className="space-y-6 text-xs sm:text-sm leading-relaxed">
              {/* Kop Surat Dokumen */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <span className="text-[11px] tracking-widest uppercase font-bold text-emerald-700">
                  Platform Hunian Kos Digital Terpercaya • FindMyKos
                </span>
                <h2 className="font-heading font-extrabold text-base sm:text-xl text-slate-900 tracking-tight uppercase">
                  SURAT PERJANJIAN SEWA MENYEWA KAMAR KOS
                </h2>
                <p className="text-xs text-slate-500 font-mono font-medium">
                  Nomor: {agreement.nomorSurat}
                </p>
                <div className="inline-block mt-1">
                  {isFullySigned ? (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      DOKUMEN RESMI SAH (OFFICIALLY SIGNED)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      MENUNGGU KELENGKAPAN TANDA TANGAN (PARTIAL)
                    </span>
                  )}
                </div>
              </div>

              {/* Pengantar */}
              <p className="text-justify">
                Pada hari ini disepakati perjanjian sewa menyewa kamar kos antara pihak-pihak di bawah ini:
              </p>

              {/* Komparasi Pihak Pertama & Kedua */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                {/* Pihak Pertama */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>PIHAK PERTAMA (PEMILIK / PENGELOLA)</span>
                  </div>
                  <div><strong className="text-slate-500">Nama:</strong> {agreement.pihakPertama.nama}</div>
                  <div><strong className="text-slate-500">Telepon / WA:</strong> {agreement.pihakPertama.phone}</div>
                  <div><strong className="text-slate-500">Email:</strong> {agreement.pihakPertama.email}</div>
                  <div><strong className="text-slate-500">Alamat:</strong> {agreement.pihakPertama.alamat}</div>
                </div>

                {/* Pihak Kedua */}
                <div className="space-y-1.5 text-xs">
                  <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] pb-1 border-b border-slate-200 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>PIHAK KEDUA (PENYEWA / PENGHUNI)</span>
                  </div>
                  <div><strong className="text-slate-500">Nama:</strong> {agreement.pihakKedua.nama}</div>
                  <div><strong className="text-slate-500">Telepon:</strong> {agreement.pihakKedua.phone}</div>
                  <div><strong className="text-slate-500">Profesi:</strong> {agreement.pihakKedua.occupation}</div>
                  <div><strong className="text-slate-500">Kontak Darurat:</strong> {agreement.pihakKedua.emergencyContact}</div>
                </div>
              </div>

              {/* Detail Objek Sewa */}
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100 text-xs space-y-1">
                <div className="font-bold text-emerald-900 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Objek Properti: {agreement.kos.nama} ({agreement.kos.type})</span>
                </div>
                <p className="text-slate-600">{agreement.kos.alamat}, Kota {agreement.kos.kota}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-semibold text-slate-700">
                  <div>Kamar: <span className="text-slate-900 font-bold">{agreement.room.nomorKamar}</span></div>
                  <div>Durasi: <span className="text-slate-900 font-bold">{agreement.ketentuanSewa.durasiBulan} Bulan</span></div>
                  <div>Tarif: <span className="text-slate-900 font-bold">{formatRupiah(agreement.ketentuanSewa.biayaSewaPerBulan)}/bln</span></div>
                  <div>Total Sewa: <span className="text-emerald-700 font-bold">{formatRupiah(agreement.ketentuanSewa.totalBiayaSewa)}</span></div>
                </div>
              </div>

              {/* Pasal-Pasal Perjanjian */}
              <div className="space-y-3 pt-2">
                {agreement.pasalPasal.map((p, idx) => (
                  <div key={idx} className="space-y-1">
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm font-heading">
                      {p.pasal}
                    </h4>
                    <p className="text-justify text-slate-600 text-xs leading-relaxed">
                      {p.isi}
                    </p>
                  </div>
                ))}
              </div>

              {/* Kolom Tanda Tangan */}
              <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-2 gap-4 text-center">
                {/* Tanda Tangan Pemilik */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    PIHAK PERTAMA (PEMILIK)
                  </span>
                  <div className="my-2">
                    {agreement.signatures.owner.signed ? (
                      <div className="space-y-1">
                        <div className="font-serif italic font-bold text-lg text-emerald-800">
                          {agreement.signatures.owner.signatureName}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Ditandatangani Digital
                        </span>
                        <p className="text-[9px] text-slate-400">
                          {new Date(agreement.signatures.owner.signedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 text-xs italic text-slate-400">
                        (Belum Ditandatangani)
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {agreement.pihakPertama.nama}
                  </span>
                </div>

                {/* Tanda Tangan Penyewa */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between min-h-[160px]">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    PIHAK KEDUA (PENYEWA)
                  </span>
                  <div className="my-2">
                    {agreement.signatures.tenant.signed ? (
                      <div className="space-y-1">
                        <div className="font-serif italic font-bold text-lg text-emerald-800">
                          {agreement.signatures.tenant.signatureName}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3" /> Ditandatangani Digital
                        </span>
                        <p className="text-[9px] text-slate-400">
                          {new Date(agreement.signatures.tenant.signedAt).toLocaleString('id-ID')}
                        </p>
                      </div>
                    ) : (
                      <div className="py-4 text-xs italic text-slate-400">
                        (Belum Ditandatangani)
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    {agreement.pihakKedua.nama}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer / Action Box */}
        {agreement && !hasUserSigned && (
          <div className="p-4 bg-emerald-50 border-t border-emerald-100 rounded-b-2xl print:hidden">
            <form onSubmit={handleSign} className="flex flex-col sm:flex-row items-center gap-3 justify-between">
              <div className="flex-1 w-full text-xs">
                <label className="block font-bold text-emerald-900 mb-1">
                  Konfirmasi Nama untuk Tanda Tangan Elektronik:
                </label>
                <input
                  type="text"
                  required
                  value={signatureName}
                  onChange={(e) => setSignatureName(e.target.value)}
                  placeholder="Ketik Nama Lengkap Anda Sesuai Identitas"
                  className="w-full px-3 py-2 bg-white rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={signing || !signatureName.trim()}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 whitespace-nowrap mt-2 sm:mt-5"
              >
                {signing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />}
                <span>Bubuhkan Tanda Tangan Digital</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
