import type { LatLon } from '../types';

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
const EARTH_R_KM = 6371;

// South-polar stereographic: south pole at centre.
// lat in degrees (negative in southern hemisphere).
export function project(lat: number, lonDeg: number, R = 100, cx = 500, cy = 500): { x: number; y: number } {
  const lon = lonDeg * DEG2RAD;
  const r = R * Math.tan(((90 + lat) * Math.PI) / 360);
  return { x: cx + r * Math.sin(lon), y: cy - r * Math.cos(lon) };
}

export function unproject(x: number, y: number, R = 100, cx = 500, cy = 500): LatLon {
  const dx = x - cx, dy = cy - y;
  const r = Math.sqrt(dx * dx + dy * dy);
  const lat = (Math.atan(r / R) * 360) / Math.PI - 90;
  const lon = Math.atan2(dx, dy) * RAD2DEG;
  return { lat, lon };
}

export function haversineKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLat = (bLat - aLat) * DEG2RAD;
  const dLon = (bLon - aLon) * DEG2RAD;
  const s1 = Math.sin(dLat / 2), s2 = Math.sin(dLon / 2);
  const a = s1 * s1 + Math.cos(aLat * DEG2RAD) * Math.cos(bLat * DEG2RAD) * s2 * s2;
  return 2 * EARTH_R_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function bearingDeg(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const dLon = (bLon - aLon) * DEG2RAD;
  const y = Math.sin(dLon) * Math.cos(bLat * DEG2RAD);
  const x = Math.cos(aLat * DEG2RAD) * Math.sin(bLat * DEG2RAD) -
    Math.sin(aLat * DEG2RAD) * Math.cos(bLat * DEG2RAD) * Math.cos(dLon);
  return (Math.atan2(y, x) * RAD2DEG + 360) % 360;
}

export function destinationPoint(lat: number, lon: number, bearingDegIn: number, km: number): LatLon {
  const d = km / EARTH_R_KM;
  const br = bearingDegIn * DEG2RAD;
  const latR = lat * DEG2RAD, lonR = lon * DEG2RAD;
  const nLat = Math.asin(Math.sin(latR) * Math.cos(d) + Math.cos(latR) * Math.sin(d) * Math.cos(br));
  const nLon = lonR + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(latR), Math.cos(d) - Math.sin(latR) * Math.sin(nLat));
  let lonDeg = (nLon * RAD2DEG) % 360;
  if (lonDeg > 180) lonDeg -= 360;
  if (lonDeg < -180) lonDeg += 360;
  return { lat: nLat * RAD2DEG, lon: lonDeg };
}

export function pointInPolygon(lat: number, lon: number, poly: LatLon[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].lon, yi = poly[i].lat;
    const xj = poly[j].lon, yj = poly[j].lat;
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function distPointToSegmentKm(p: LatLon, a: LatLon, b: LatLon): number {
  // equirectangular approx, fine for short segments
  const mx = (aLat: number) => Math.cos(aLat * DEG2RAD);
  const ax = a.lon * mx(a.lat), ay = a.lat;
  const bx = b.lon * mx(a.lat), by = b.lat;
  const px = p.lon * mx(a.lat), py = p.lat;
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1e-9;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
  const clat = ay + t * dy, clon = (ax + t * dx) / mx(a.lat);
  return haversineKm(p.lat, p.lon, clat, clon);
}

export function distToRouteKm(p: LatLon, route: LatLon[]): number {
  if (route.length === 0) return Infinity;
  if (route.length === 1) return haversineKm(p.lat, p.lon, route[0].lat, route[0].lon);
  let m = Infinity;
  for (let i = 0; i < route.length - 1; i++) m = Math.min(m, distPointToSegmentKm(p, route[i], route[i + 1]));
  return m;
}
