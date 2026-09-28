import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { MapPinOff } from 'lucide-react';

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl });

const TILE_URL = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = import.meta.env.VITE_MAP_TILE_ATTRIBUTION
  || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Peta lokasi kos berbasis Leaflet.
 * Tile layer dapat dikonfigurasi via VITE_MAP_TILE_URL (default OpenStreetMap, tanpa API key).
 * Menampilkan fallback jika koordinat tidak tersedia.
 */
export default function KosMap({ latitude, longitude, label }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasValidCoords = Number.isFinite(lat) && Number.isFinite(lng)
    && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  useEffect(() => {
    if (!hasValidCoords || !containerRef.current || mapRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 16,
      scrollWheelZoom: false
    });

    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19
    }).addTo(map);

    const marker = L.marker([lat, lng]).addTo(map);
    if (label) {
      marker.bindPopup(label).openPopup();
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [hasValidCoords, lat, lng, label]);

  if (!hasValidCoords) {
    return (
      <div className="h-56 bg-slate-100 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-3">
          <MapPinOff className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-700">Lokasi peta belum tersedia.</p>
        <p className="text-xs text-slate-500 mt-1">Pemilik kos belum menambahkan koordinat lokasi untuk properti ini.</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-64 rounded-xl border border-slate-200 overflow-hidden z-0"
      aria-label={`Peta lokasi ${label || 'kos'}`}
    />
  );
}
