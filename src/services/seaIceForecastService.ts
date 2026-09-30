import { fbm2 } from './rng';
import { VESSEL } from '../data/vessel';
import { STATIONS } from '../data/stations';
import { TIME_STEPS, CORRIDOR_TARGETS } from '../data/scenario';
import type { RiskLevel } from '../types';

export function clamp(v: number, a = 0, b = 100): number { return Math.max(a, Math.min(b, v)); }

// Base concentration: rises toward the coast (south), plus noise, plus time growth.
export function seaIceConcentration(lat: number, lon: number, tHours: number): number {
  const base = (-lat - 56) * 6.5;
  const noise = (fbm2(lat * 0.55 + 10, lon * 0.55 - 4, 77) - 0.5) * 26;
  const coastal = clamp((-lat - 60) * 12, 0, 22);
  const timeTerm = tHours * 0.33 * (0.55 + coastal / 30);
  const corridorBoost = corridorProximity(lat, lon) * tHours * 0.12;
  return clamp(base + noise + timeTerm + corridorBoost, 2, 98);
}

// How close is (lat,lon) to the scripted route corridor (start -> Bharati dest)?
function corridorProximity(lat: number, lon: number): number {
  // corridor centre line approx: lon = 50 + (-lat - 58) * 2.55
  const centreLon = 50 + (-lat - 58) * 2.55;
  const d = Math.abs(lon - centreLon);
  return clamp(1 - d / 14, 0, 1);
}

export function confidenceAt(tHours: number): number {
  return clamp(0.95 - tHours * 0.0055, 0.5, 0.95);
}

// Sample corridor average along the start->Bharati line
export function corridorAverage(tHours: number): number {
  const dest = STATIONS[0];
  let sum = 0; const N = 24;
  for (let i = 0; i < N; i++) {
    const f = i / (N - 1);
    const lat = VESSEL.startLat + (dest.destLat - VESSEL.startLat) * f;
    const lon = VESSEL.startLon + (dest.destLon - VESSEL.startLon) * f;
    sum += seaIceConcentration(lat, lon, tHours);
  }
  return sum / N;
}

export function seaIceForecast(): { steps: number[]; corridorConcentration: number[]; confidence: number[]; trend: string; risk: RiskLevel } {
  void CORRIDOR_TARGETS;
  const corridorConcentration = TIME_STEPS.map((t) => Math.round(corridorAverage(t)));
  const confidence = TIME_STEPS.map((t) => Math.round(confidenceAt(t) * 100));
  const trend = corridorConcentration[corridorConcentration.length - 1] > corridorConcentration[0] + 5
    ? 'Increasing concentration along corridor' : 'Stable';
  const last = corridorConcentration[corridorConcentration.length - 1];
  const risk: RiskLevel = last > 80 ? 'CRITICAL' : last > 60 ? 'HIGH' : last > 35 ? 'MODERATE' : 'LOW';
  return { steps: TIME_STEPS, corridorConcentration, confidence, trend, risk };
}

// Coarse grid for map heat layer (lat/lon bins)
export function seaIceGrid(tHours: number, nLat = 46, nLon = 60): { lat: number; lon: number; c: number }[] {
  const out: { lat: number; lon: number; c: number }[] = [];
  for (let i = 0; i < nLat; i++) {
    const lat = -52 - (72 - 52) * (i / (nLat - 1)) * -1; // -52 .. -72
    const la = -52 - (20 * i) / (nLat - 1);
    for (let j = 0; j < nLon; j++) {
      const lon = 5 + (85 * j) / (nLon - 1);
      void lat;
      out.push({ lat: la, lon, c: seaIceConcentration(la, lon, tHours) });
    }
  }
  return out;
}

// Ice-edge: for each lon bin, find southernmost lat where c crosses 15%
export function iceEdge(tHours: number): { lat: number; lon: number }[] {
  const edge: { lat: number; lon: number }[] = [];
  for (let j = 0; j <= 40; j++) {
    const lon = 5 + (85 * j) / 40;
    let found = -58;
    for (let lat = -52; lat >= -72; lat -= 0.5) {
      if (seaIceConcentration(lat, lon, tHours) >= 15) { found = lat; break; }
    }
    edge.push({ lat: found, lon });
  }
  return edge;
}
