import { fbm2 } from './rng';
import type { WeatherState } from '../types';

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export function dirLabel(deg: number): string { return DIRS[Math.round(deg / 45) % 8]; }

// Deterministic fields of (lat, lon, t). Baseline near vessel start at t=0:
// wind 38 km/h NE, current 0.8 m/s E, waves 3.2 m, air -12 C.
export function weatherAt(lat: number, lon: number, tHours: number): WeatherState {
  const n1 = fbm2(lat * 0.4, lon * 0.4, 501);
  const n2 = fbm2(lat * 0.3 + 40, lon * 0.3, 902);
  const south = Math.max(0, -lat - 58); // 0 at start, grows southward
  const windSpeedKmh = 38 + south * 1.1 + (n1 - 0.5) * 12 + tHours * 0.28;
  const windDirDeg = (45 + (n2 - 0.5) * 60 + tHours * 0.6) % 360;
  const airTempC = -12 - south * 0.9 - tHours * 0.06 + (n1 - 0.5) * 3;
  const sstC = 1.5 - south * 0.35 - tHours * 0.012;
  const currentSpeedMs = 0.8 + (n2 - 0.5) * 0.35 + south * 0.02;
  const currentDirDeg = (90 + (n1 - 0.5) * 50) % 360;
  const waveHeightM = Math.max(0.5, 3.2 + south * 0.12 + tHours * 0.035 + (n2 - 0.5) * 1.2);
  const visibilityKm = Math.max(0.8, 14 - south * 0.5 - tHours * 0.09 - Math.max(0, waveHeightM - 4) * 1.5);
  return {
    windSpeedKmh: Math.round(windSpeedKmh * 10) / 10,
    windDirDeg: Math.round(windDirDeg), windDirLabel: dirLabel(windDirDeg),
    airTempC: Math.round(airTempC * 10) / 10,
    sstC: Math.round(sstC * 10) / 10,
    currentSpeedMs: Math.round(currentSpeedMs * 100) / 100,
    currentDirDeg: Math.round(currentDirDeg),
    waveHeightM: Math.round(waveHeightM * 10) / 10,
    visibilityKm: Math.round(visibilityKm * 10) / 10
  };
}
