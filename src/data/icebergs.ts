import type { Iceberg } from '../types';

// A-23 placed so its predicted track crosses the direct route
// RV POLARIS (-58,50) -> Bharati ocean waypoint (-67.6,74.5) around +36..48h.
export const ICEBERGS: Iceberg[] = [
  { id: 'A-23', lat: -62.8, lon: 58.0, sizeKm2: 48, massMt: 210, speedKmPerDay: 50, directionDeg: 95, baseRisk: 85 },
  { id: 'B-17', lat: -64.2, lon: 70.5, sizeKm2: 22, massMt: 96, speedKmPerDay: 34, directionDeg: 70, baseRisk: 60 },
  { id: 'C-09', lat: -60.8, lon: 54.0, sizeKm2: 12, massMt: 52, speedKmPerDay: 28, directionDeg: 120, baseRisk: 45 },
  { id: 'D-41', lat: -66.4, lon: 80.5, sizeKm2: 31, massMt: 140, speedKmPerDay: 40, directionDeg: 55, baseRisk: 65 },
  { id: 'E-12', lat: -59.5, lon: 44.0, sizeKm2: 7, massMt: 28, speedKmPerDay: 25, directionDeg: 100, baseRisk: 35 }
];
