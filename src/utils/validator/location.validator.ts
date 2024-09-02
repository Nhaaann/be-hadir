// import { GeoLocation } from 'src/app/geo-location/geo-location.entity';

// Fungsi untuk mengecek apakah lokasi dalam jangkauan
export function isLocationWithinRange(
  currentLat: number,
  currentLng: number,
  // geoEntity: GeoLocation,
): boolean {
  // Implementasikan logika untuk memeriksa apakah currentLocation dalam jangkauan geoEntity
  // const { latitude: targetLatitude, longitude: targetLongitude } = geoEntity; // Lokasi tujuan

  // Misalnya, menggunakan jarak dalam meter
  const distance = this.calculateDistance(
    currentLat,
    currentLng,
    // targetLatitude,
    // targetLongitude,
  );
  return distance <= 100; // Radius dalam meter
}

// Fungsi untuk menghitung jarak antara dua koordinat
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371e3; // Radius bumi dalam meter
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
