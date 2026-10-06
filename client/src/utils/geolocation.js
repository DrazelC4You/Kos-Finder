/**
 * Geolocation & Distance Calculation Utility for Singgah
 * Murni algoritma: Haversine, format jarak, dan permintaan lokasi browser.
 * Katalog kampus ada di src/data/campuses.js.
 */

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
