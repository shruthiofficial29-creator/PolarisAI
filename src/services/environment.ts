import { seaIceConcentration, confidenceAt } from './seaIceForecastService';
import { icebergPositionAt, uncertaintyRadiusKm } from './icebergTrajectoryService';
import { weatherAt } from './weatherService';
import { ICEBERGS } from '../data/icebergs';
import type { EnvironmentSnapshot } from '../types';

// Single source of truth for time: pure deterministic function of t (hours, 0..72).
export function getEnvironment(tHours: number): EnvironmentSnapshot {
  const t = Math.max(0, Math.min(72, tHours));
  return {
    tHours: t,
    seaIceAt: (lat: number, lon: number) => seaIceConcentration(lat, lon, t),
    icebergs: ICEBERGS.map((ib) => {
      const p = icebergPositionAt(ib, t);
      return { id: ib.id, lat: p.lat, lon: p.lon, uncertaintyKm: uncertaintyRadiusKm(t) };
    }),
    weatherAt: (lat: number, lon: number) => weatherAt(lat, lon, t),
    confidence: confidenceAt(t)
  };
}
