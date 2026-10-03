import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import { CITY_CHIPS } from '../data/campuses.js';

export const FACILITY_CATEGORIES = [
  {
    id: 'kamar',
    title: 'Fasilitas Kamar',
    items: ['AC', 'Kamar mandi dalam', 'Kasur', 'Lemari', 'Meja & Kursi', 'WiFi', 'Listrik']
  },
  {
    id: 'bersama',
    title: 'Fasilitas Bersama',
    items: ['Dapur Bersama', 'Kulkas Bersama', 'Ruang Tamu', 'Mesin Cuci']
  },
  {
    id: 'parkir_keamanan',
    title: 'Parkir & Keamanan',
    items: ['Parkir', 'Akses 24 Jam', 'CCTV']
  }
];

export const POPULAR_RULES = [
  { key: '24jam', label: 'Akses Bebas 24 Jam', desc: 'Tanpa jam malam gerbang' },
  { key: 'pasutri', label: 'Boleh Pasutri', desc: 'Menerima pasangan suami istri' },
  { key: 'bebas_asap', label: 'Bebas Asap Rokok', desc: 'Kamar dilarang merokok' }
];

export const TENANT_TYPES = [
  { value: '', label: 'Semua Tipe' },
  { value: 'CAMPUR', label: 'Campur' },
  { value: 'PUTRI', label: 'Khusus Putri' },
  { value: 'PUTRA', label: 'Khusus Putra' }
];

export const RATING_OPTIONS = [
  { value: '', label: 'Semua Rating' },
  { value: '4.0', label: '4.0 ke atas' },
  { value: '4.5', label: '4.5 ke atas' },
  { value: '4.8', label: '4.8 ke atas' }
];

const FIELD = 'w-full text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
const LABEL = 'block text-xs font-semibold text-slate-600 mb-1.5';

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className={LABEL}>{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(({ value, label: text, title }) => {
          const on = selected.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={on}
              title={title}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                on
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Satu-satunya form filter. Dipakai sidebar desktop dan drawer mobile supaya
 * keduanya tidak bisa lagi berbeda isi maupun judul.
 *
 * `filters` = objek state, `setFilter(key, value)` = patch,
 * `toggleIn(key, value)` = tambah/buang dari array.
 */
export default function SearchFilters({ filters, setFilter, toggleIn, onReset }) {
  return (
    <div className="space-y-5">
      <div>
        <label className={LABEL} htmlFor="filter-kata-kunci">Kata kunci</label>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="filter-kata-kunci"
            type="text"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            placeholder="Nama kos, jalan, atau kawasan"
            className={`${FIELD} pl-9`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
        <div>
          <label className={LABEL} htmlFor="filter-kota">Kota</label>
          <select
            id="filter-kota"
            value={filters.kota}
            onChange={(e) => setFilter('kota', e.target.value)}
            className={FIELD}
          >
            {CITY_CHIPS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={LABEL} htmlFor="filter-tipe">Tipe penghuni</label>
          <select
            id="filter-tipe"
            value={filters.type}
            onChange={(e) => setFilter('type', e.target.value)}
            className={FIELD}
          >
            {TENANT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <span className={LABEL}>Harga per bulan (Rp)</span>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            inputMode="numeric"
            step="50000"
            min="0"
            placeholder="Minimum"
            aria-label="Harga minimum"
            value={filters.minPrice}
            onChange={(e) => setFilter('minPrice', e.target.value)}
            className={FIELD}
          />
          <input
            type="number"
            inputMode="numeric"
            step="50000"
            min="0"
            placeholder="Maksimal"
            aria-label="Harga maksimal"
            value={filters.maxPrice}
            onChange={(e) => setFilter('maxPrice', e.target.value)}
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <label className={LABEL} htmlFor="filter-rating">Rating minimal</label>
        <select
          id="filter-rating"
          value={filters.minRating}
          onChange={(e) => setFilter('minRating', e.target.value)}
          className={FIELD}
        >
          {RATING_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none text-sm text-slate-700">
        <input
          type="checkbox"
          checked={filters.availableOnly}
          onChange={(e) => setFilter('availableOnly', e.target.checked)}
          className="w-4 h-4 rounded accent-emerald-600"
        />
        <span>Hanya kamar yang masih kosong</span>
      </label>

      <ChipGroup
        label="Aturan kos"
        options={POPULAR_RULES.map((r) => ({ value: r.key, label: r.label, title: r.desc }))}
        selected={filters.rules}
        onToggle={(key) => toggleIn('rules', key)}
      />

      {FACILITY_CATEGORIES.map((cat) => (
        <ChipGroup
          key={cat.id}
          label={cat.title}
          options={cat.items.map((item) => ({ value: item, label: item }))}
          selected={filters.facilities}
          onToggle={(item) => toggleIn('facilities', item)}
        />
      ))}

      <button
        type="button"
        onClick={onReset}
        className="w-full py-2 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset semua filter</span>
      </button>
    </div>
  );
}
