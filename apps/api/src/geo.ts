const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points in kilometres. */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

/** Lat/lng box that contains every point within `radiusKm` of the centre. */
export function boundingBox(lat: number, lng: number, radiusKm: number) {
  const dLat = (radiusKm / EARTH_RADIUS_KM) * (180 / Math.PI);
  const dLng = dLat / Math.max(0.01, Math.cos(toRad(lat)));
  return { minLat: lat - dLat, maxLat: lat + dLat, minLng: lng - dLng, maxLng: lng + dLng };
}

/** Grid cell size in degrees (~11 km north-south). */
const CELL_DEG = 0.1;

/** Snap a point to the centre of its grid cell so nearby users share one cached fetch. */
export function snapToCell(lat: number, lng: number) {
  const snap = (v: number) => Math.floor(v / CELL_DEG) * CELL_DEG + CELL_DEG / 2;
  const cellLat = Number(snap(lat).toFixed(4));
  const cellLng = Number(snap(lng).toFixed(4));
  return { lat: cellLat, lng: cellLng, key: `${cellLat},${cellLng}` };
}
