import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Printer, XCircle,
  Loader2, QrCode, Building2, Receipt, AlertCircle, CreditCard
} from 'lucide-react';
import api from '../services/api.js';
import { formatRupiah } from './KosCard.jsx';

export default function OfficialInvoiceModal({ bookingId, onClose }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bookingId) {
      setLoading(true);
      setError('');
      api.get(`/agreements/${bookingId}/invoice`)
        .then(res => {
          if (res.data.success) {
            setInvoice(res.data.data);
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Gagal memuat invoice & kwitansi.');
        })
        .finally(() => setLoading(false));
    }
  }, [bookingId]);

  const handlePrint = () => {
    window.print();
  };

  if (!bookingId) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-slate-900">
                Kwitansi & Invoice Resmi
              </h3>
              <p className="text-[11px] text-slate-500">
                Bukti Pembayaran Sah Transaksi Sewa Kos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Kwitansi</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 text-slate-800 space-y-6 print:p-0 print:text-black">
          {loading ? (
            <div className="py-16 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
              <p className="text-xs">Memuat dokumen kwitansi resmi...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : invoice ? (
            <div id="printable-invoice" className="space-y-6 text-xs sm:text-sm">
              {/* Kop Kwitansi */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-extrabold text-lg tracking-tight">
                    <Building2 className="w-5 h-5" />
                    <span>KosFinder Indonesia</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Sistem Pembayaran & Administrasi Hunian Kos Nasional
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="font-mono text-xs font-bold text-slate-700 block">
                    {invoice.nomorKwitansi}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Ref: {invoice.nomorInvoice}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tanggal: {new Date(invoice.tanggalInvoice).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status Lunas Stamp */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Transaksi</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {invoice.statusPembayaran === 'LUNAS' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        LUNAS / VERIFIED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                        MENUNGGU KONFIRMASI
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Metode Pembayaran</span>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end mt-0.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                    {invoice.paymentDetails?.metodePembayaran || 'Transfer Bank'}
                  </span>
                </div>
              </div>

              {/* Rincian Pihak Penyewa & Kos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Diterima Dari (Penyewa)</span>
                  <h4 className="font-bold text-slate-900 text-sm">{invoice.tenant.nama}</h4>
                  <p className="text-slate-500">{invoice.tenant.phone} • {invoice.tenant.email}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Untuk Pembayaran Unit</span>
                  <h4 className="font-bold text-slate-900 text-sm">{invoice.kos.nama} ({invoice.room.nomorKamar})</h4>
                  <p className="text-slate-500">{invoice.kos.alamat}, {invoice.kos.kota}</p>
                </div>
              </div>

              {/* Tabel Rincian Biaya */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Deskripsi Item</th>
                      <th className="p-3 text-center">Durasi</th>
                      <th className="p-3 text-right">Tarif / Bln</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.rincianItem.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-3 font-medium text-slate-800">{item.deskripsi}</td>
                        <td className="p-3 text-center text-slate-600">{item.durasi}</td>
                        <td className="p-3 text-right text-slate-600">{formatRupiah(item.hargaSatuan)}</td>
                        <td className="p-3 text-right font-bold text-slate-900">{formatRupiah(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-xs sm:text-sm">
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-slate-600">Subtotal Sewa:</td>
                      <td className="p-3 text-right text-slate-900">{formatRupiah(invoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-slate-600">Biaya Administrasi Aplikasi:</td>
                      <td className="p-3 text-right text-emerald-700">GRATIS</td>
                    </tr>
                    <tr className="bg-emerald-50/70 text-emerald-900 font-extrabold text-sm sm:text-base border-t-2 border-emerald-600">
                      <td colSpan={3} className="p-3 text-right">Total Pembayaran:</td>
                      <td className="p-3 text-right">{formatRupiah(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* QR Verification & Legal Note */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-lg border border-slate-300 flex items-center justify-center p-1">
                    <QrCode className="w-8 h-8 text-slate-800" />
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kode Verifikasi Keaslian</span>
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{invoice.verificationCode}</span>
                    <p className="text-[10px] text-slate-500">Terverifikasi secara digital oleh KosFinder Database</p>
                  </div>
                </div>

                <div className="text-center sm:text-right text-xs">
                  <span className="text-[10px] text-slate-400 block font-bold">Dikelola Oleh Pemilik</span>
                  <span className="font-bold text-slate-800">{invoice.owner.nama}</span>
                  <span className="text-[10px] text-slate-500 block">{invoice.owner.phone}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
