/**
 * Geolocation & Distance Calculation Utility for KosFinder
 * Supports campus recommendations and distance-based sorting using the Haversine formula.
 */

// Curated campus landmarks with exact coordinates and thematic gradient styling
export const DEFAULT_CAMPUS_PRESETS = [
  {
    id: 'unsoed',
    name: 'UNSOED Purwokerto',
    full: 'Universitas Jenderal Soedirman',
    area: 'Grendeng & Karangwangkal',
    city: 'Purwokerto',
    latitude: -7.4243,
    longitude: 109.2486,
    bg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/30 hover:border-emerald-400'
  },
  {
    id: 'ump',
    name: 'UMP Purwokerto',
    full: 'Univ. Muhammadiyah Purwokerto',
    area: 'Dukuhwaluh & Kembaran',
    city: 'Purwokerto',
    latitude: -7.4180,
    longitude: 109.2710,
    bg: 'from-blue-900/60 to-blue-950/90 border-blue-500/30 hover:border-blue-400'
  },
  {
    id: 'telkom',
    name: 'Telkom University',
    full: 'Telkom University Purwokerto',
    area: 'Jl. D.I. Panjaitan',
    city: 'Purwokerto',
    latitude: -7.4420,
    longitude: 109.2550,
    bg: 'from-rose-900/60 to-rose-950/90 border-rose-500/30 hover:border-rose-400'
  },
  {
    id: 'uinsaizu',
    name: 'UIN Saizu Purwokerto',
    full: 'UIN Prof. K.H. Saifuddin Zuhri',
    area: 'Karangkobar, Purwokerto Barat',
    city: 'Purwokerto',
    latitude: -7.4120,
    longitude: 109.2250,
    bg: 'from-teal-900/60 to-teal-950/90 border-teal-500/30 hover:border-teal-400'
  },
  {
    id: 'ugm',
    name: 'UGM Yogyakarta',
    full: 'Universitas Gadjah Mada & UNY',
    area: 'Kaliurang, Bulaksumur',
    city: 'Yogyakarta',
    latitude: -7.7602,
    longitude: 110.3804,
    bg: 'from-amber-900/60 to-amber-950/90 border-amber-500/30 hover:border-amber-400'
  },
  {
    id: 'ui',
    name: 'UI Depok & Salemba',
    full: 'Universitas Indonesia',
    area: 'Margonda & Kukusan',
    city: 'Depok',
    latitude: -6.3689,
    longitude: 106.8321,
    bg: 'from-yellow-900/60 to-yellow-950/90 border-yellow-500/30 hover:border-yellow-400'
  },
  {
    id: 'itb',
    name: 'ITB & UNPAD Bandung',
    full: 'Institut Teknologi Bandung',
    area: 'Dago & Dipatiukur',
    city: 'Bandung',
    latitude: -6.8789,
    longitude: 107.6189,
    bg: 'from-cyan-900/60 to-cyan-950/90 border-cyan-500/30 hover:border-cyan-400'
  },
  {
    id: 'undip',
    name: 'UNDIP Semarang',
    full: 'Universitas Diponegoro',
    area: 'Tembalang & Pleburan',
    city: 'Semarang',
    latitude: -7.0543,
    longitude: 110.4389,
    bg: 'from-indigo-900/60 to-indigo-950/90 border-indigo-500/30 hover:border-indigo-400'
  },
  {
    id: 'ub',
    name: 'UB & UM Malang',
    full: 'Universitas Brawijaya & UM',
    area: 'Soekarno Hatta (Suhat)',
    city: 'Malang',
    latitude: -7.9482,
    longitude: 112.6179,
    bg: 'from-orange-900/60 to-orange-950/90 border-orange-500/30 hover:border-orange-400'
  },
  {
    id: 'unair',
    name: 'UNAIR & ITS Surabaya',
    full: 'Universitas Airlangga & ITS',
    area: 'Gubeng & Sukolilo',
    city: 'Surabaya',
    latitude: -7.2721,
    longitude: 112.7562,
    bg: 'from-sky-900/60 to-sky-950/90 border-sky-500/30 hover:border-sky-400'
  },
  {
    id: 'bali',
    name: 'Udayana Bali',
    full: 'Universitas Udayana',
    area: 'Renon & Jimbaran',
    city: 'Denpasar',
    latitude: -8.6789,
    longitude: 115.2341,
    bg: 'from-emerald-900/60 to-emerald-950/90 border-emerald-500/30 hover:border-emerald-400'
  }
];

/**
 * Calculates the great-circle distance between two geographic coordinates using the Haversine formula.
 * @param {number} lat1 Latitude of first point
 * @param {number} lon1 Longitude of first point
 * @param {number} lat2 Latitude of second point
 * @param {number} lon2 Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined || lat1 === null ||
    lon1 === undefined || lon1 === null ||
    lat2 === undefined || lat2 === null ||
    lon2 === undefined || lon2 === null
  ) {
    return Infinity;
  }

  const toRad = (angle) => (angle * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats a distance number into a localized, user-friendly string.
 * Example outputs: "850 m dari Anda" or "1.2 km dari lokasi Anda"
 * @param {number} distanceKm Distance in kilometers
 * @returns {string} Formatted label
 */
export function formatDistance(distanceKm) {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm) || distanceKm === Infinity) {
    return '';
  }

  if (distanceKm < 1) {
    const meters = Math.max(50, Math.round(distanceKm * 1000));
    return `${meters} m dari Anda`;
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km dari lokasi Anda`;
  }

  return `${Math.round(distanceKm)} km dari lokasi Anda`;
}

/**
 * Sorts campus/kos items by distance from user coordinates.
 * @param {Array} items List of items with latitude and longitude
 * @param {{latitude: number, longitude: number}} userCoords
 * @param {number} maxCoverageKm Maximum distance threshold (default: 150 km)
 * @returns {{
 *   sorted: Array,
 *   nearby: Array,
 *   isOutsideCoverage: boolean,
 *   closest: Object|null
 * }}
 */
export function sortRecommendationsByLocation(items, userCoords, maxCoverageKm = 150) {
  if (!items || items.length === 0) {
    return { sorted: [], nearby: [], isOutsideCoverage: false, closest: null };
  }

  if (!userCoords || typeof userCoords.latitude !== 'number' || typeof userCoords.longitude !== 'number') {
    return {
      sorted: [...items],
      nearby: [...items],
      isOutsideCoverage: false,
      closest: null
    };
  }

  const itemsWithDistance = items.map((item) => {
    const distance = calculateHaversineDistance(
      userCoords.latitude,
      userCoords.longitude,
      item.latitude ?? item.lat,
      item.longitude ?? item.lng
    );

    return {
      ...item,
      distance,
      distanceText: formatDistance(distance)
    };
  });

  // Sort ascending by nearest distance
  itemsWithDistance.sort((a, b) => a.distance - b.distance);

  const closest = itemsWithDistance[0] || null;
  const nearby = itemsWithDistance.filter((item) => item.distance <= maxCoverageKm);
  const isOutsideCoverage = closest !== null && closest.distance > maxCoverageKm;

  return {
    sorted: itemsWithDistance,
    nearby,
    isOutsideCoverage,
    closest
  };
}

/**
 * Requests user coordinates using browser Geolocation API.
 * Wraps in a Promise with descriptive error messages.
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export function requestUserLocation() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject({
        code: 'NOT_SUPPORTED',
        message: 'Browser Anda tidak mendukung deteksi lokasi otomatis.'
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Gagal mendeteksi lokasi.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Izin lokasi tidak diberikan. Aktifkan izin lokasi di browser Anda untuk melihat rekomendasi terdekat.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Informasi lokasi perangkat Anda saat ini tidak tersedia.';
            break;
          case error.TIMEOUT:
            message = 'Permintaan lokasi melebihi batas waktu (timeout). Silakan coba lagi.';
            break;
          default:
            message = 'Terjadi kendala saat membaca lokasi perangkat Anda.';
        }
        reject({
          code: error.code,
          message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // Cache for 5 minutes
      }
    );
  });
}
