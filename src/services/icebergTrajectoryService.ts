import { destinationPoint } from './geo';
import type { Iceberg } from '../types';

// Ocean current contribution: 0.8 m/s east ≈ 69 km/day east, 8 km/day south.
const CURRENT_EAST_KM_DAY = 62;
const CURRENT_SOUTH_KM_DAY = 7;

export function icebergPositionAt(ib: Iceberg, tHours: number): { lat: number; lon: number } {
  const days = tHours / 24;
  const ownKm = ib.speedKmPerDay * days;
  const p1 = destinationPoint(ib.lat, ib.lon, ib.directionDeg, ownKm);
  // current pushes east (+90°) and slightly south (180°): combine as vector approx
  const eastKm = CURRENT_EAST_KM_DAY * days;
  const p2 = destinationPoint(p1.lat, p1.lon, 90, eastKm);
  const p3 = destinationPoint(p2.lat, p2.lon, 180, CURRENT_SOUTH_KM_DAY * days);
  return { lat: p3.lat, lon: p3.lon };
}

const R_TABLE: [number, number][] = [[0, 2], [12, 6], [24, 15], [48, 38], [72, 70]];

export function uncertaintyRadiusKm(tHours: number): number {
  if (tHours <= 0) return R_TABLE[0][1];
  for (let i = 1; i < R_TABLE.length; i++) {
    if (tHours <= R_TABLE[i][0]) {
      const [t0, r0] = R_TABLE[i - 1]; const [t1, r1] = R_TABLE[i];
      const f = (tHours - t0) / (t1 - t0);
      return r0 + (r1 - r0) * f;
    }
  }
  return 70;
}

export function trajectorySteps(ib: Iceberg, steps = [0, 12, 24, 48, 72]): { t: number; lat: number; lon: number; r: number }[] {
  return steps.map((t) => ({ t, ...icebergPositionAt(ib, t), r: uncertaintyRadiusKm(t) }));
}

export function trajectoryConfidence(tHours: number): number {
  return Math.max(0.45, 0.95 - tHours * 0.007);
}
