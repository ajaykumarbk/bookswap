/**
 * Haversine formula to calculate the great-circle distance between two points
 * on a sphere given their longitudes and latitudes in decimal degrees.
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place (e.g. 2.4 km)
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Returns a randomized offset coordinate (~300m - 800m) to obscure exact location.
 * Used for map markers and user location privacy protection.
 */
export function blurCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  // 0.005 degrees latitude is approx 550m
  const latOffset = (Math.random() - 0.5) * 0.008;
  const lonOffset = (Math.random() - 0.5) * 0.008;
  return {
    lat: Math.round((lat + latOffset) * 10000) / 10000,
    lon: Math.round((lon + lonOffset) * 10000) / 10000,
  };
}
