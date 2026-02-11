// Default user location: Portland, OR city center
const USER_LAT = 45.5155;
const USER_LNG = -122.6789;

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Calculate distance between two geographic coordinates using the Haversine formula.
 * Returns formatted string like "2.3 mi".
 */
export function getDistance(lat: number, lng: number): string {
  const dLat = toRadians(lat - USER_LAT);
  const dLng = toRadians(lng - USER_LNG);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(USER_LAT)) *
      Math.cos(toRadians(lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_MILES * c;

  return `${distance.toFixed(1)} mi`;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
