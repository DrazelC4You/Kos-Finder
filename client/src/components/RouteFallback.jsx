import React from 'react';
import { Loader2 } from 'lucide-react';

export default function RouteFallback() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      <p className="text-xs font-medium text-slate-500">Memuat halaman…</p>
    </div>
  );
}
