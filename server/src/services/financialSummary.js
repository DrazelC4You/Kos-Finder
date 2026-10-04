/**
 * Ringkasan keuangan pemilik, dipisah dari db.js supaya jalur memory store dan
 * jalur Prisma menghitung dari satu implementasi yang sama.
 *
 * Yang masuk ke sini hanya aritmetika murni: kedua jalur tinggal menyerahkan
 * baris pembayaran ({ status, jumlahTransfer, updatedAt }) milik pemiliknya.
 * `jumlahTransfer` bisa berupa number (memory) maupun Decimal (Prisma), jadi
 * selalu dilewatkan Number() lebih dulu.
 */
export function computeOwnerFinancialSummary(payments, now = new Date()) {
  const confirmed = payments.filter(p => p.status === 'CONFIRMED');
  const pending = payments.filter(p => p.status === 'PENDING');
  const rejected = payments.filter(p => p.status === 'REJECTED');

  const total = (rows) => rows.reduce((sum, p) => sum + Number(p.jumlahTransfer), 0);

  // 6 bulan terakhir, berdasarkan saat pembayaran dikonfirmasi (updatedAt).
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const inMonth = confirmed.filter(p => {
      const pd = new Date(p.updatedAt);
      return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
    });
    monthlyData.push({
      bulan: d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
      pendapatan: total(inMonth),
      jumlahTransaksi: inMonth.length
    });
  }

  return {
    totalPendapatan: total(confirmed),
    menungguKonfirmasi: total(pending),
    totalTransaksiKonfirmasi: confirmed.length,
    totalTransaksiPending: pending.length,
    totalTransaksiDitolak: rejected.length,
    monthlyData
  };
}
