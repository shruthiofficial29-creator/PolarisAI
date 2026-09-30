import { seaIceConcentration, confidenceAt } from './seaIceForecastService';
import { icebergPositionAt, uncertaintyRadiusKm } from './icebergTrajectoryService';
import { weatherAt } from './weatherService';
import { haversineKm, distToRouteKm } from './geo';
import { ICEBERGS } from '../data/icebergs';
import { hazardZone } from './hazardZone';
import type { RiskLevel, RiskResult, RouteWaypoint } from '../types';

export const RISK_WEIGHTS = { seaIce: 0.3, iceberg: 0.3, weather: 0.15, ocean: 0.1, uncertainty: 0.15 };

export function levelFor(score: number): RiskLevel {
  if (score >= 81) return 'CRITICAL';
  if (score >= 61) return 'HIGH';
  if (score >= 31) return 'MODERATE';
  return 'LOW';
}

function icebergComponent(lat: number, lon: number, t: number): { v: number; hit: string | null } {
  let best = 0; let hit: string | null = null;
  for (const ib of ICEBERGS) {
    const p = icebergPositionAt(ib, t);
    const r = uncertaintyRadiusKm(t);
    const d = haversineKm(lat, lon, p.lat, p.lon);
    let v: number;
    if (d <= r) v = 92;
    else v = 92 * Math.exp(-(d - r) / 70);
    v = (v * ib.baseRisk) / 100;
    if (v > best) { best = v; hit = ib.id; }
  }
  // Forecast hazard zone (ice convergence / berg risk) folds into the iceberg factor.
  const hz = hazardZone(lat, lon, t) * 0.95;
  if (hz > best) { best = hz; hit = hit ?? 'HZ-62E'; }
  return { v: Math.min(100, best), hit };
}

export function riskAtPoint(lat: number, lon: number, tHours: number): RiskResult {
  const seaIce = seaIceConcentration(lat, lon, tHours);
  const { v: iceberg, hit } = icebergComponent(lat, lon, tHours);
  const w = weatherAt(lat, lon, tHours);
  const weather = Math.min(100, (w.windSpeedKmh / 70) * 70 + (w.waveHeightM / 8) * 30);
  const ocean = Math.min(100, (w.currentSpeedMs / 1.6) * 55 + Math.max(0, (2 - w.sstC)) * 12);
  const uncertainty = (1 - confidenceAt(tHours)) * 100;
  const c = { seaIce, iceberg, weather, ocean, uncertainty };
  const score = RISK_WEIGHTS.seaIce * c.seaIce + RISK_WEIGHTS.iceberg * c.iceberg +
    RISK_WEIGHTS.weather * c.weather + RISK_WEIGHTS.ocean * c.ocean + RISK_WEIGHTS.uncertainty * c.uncertainty;
  const reasons: string[] = [];
  if (seaIce >= 55) reasons.push(`High sea-ice concentration (${Math.round(seaIce)}%)`);
  else if (seaIce >= 35) reasons.push(`Moderate sea-ice concentration (${Math.round(seaIce)}%)`);
  if (hit && iceberg >= 40) reasons.push(`Predicted iceberg ${hit} intersection risk within uncertainty zone`);
  else if (hit && iceberg >= 20) reasons.push(`Iceberg ${hit} within caution range`);
  if (w.windSpeedKmh >= 45) reasons.push(`Strong wind (${Math.round(w.windSpeedKmh)} km/h ${w.windDirLabel})`);
  else if (w.windSpeedKmh >= 35) reasons.push(`Fresh crosswind (${Math.round(w.windSpeedKmh)} km/h)`);
  if (w.waveHeightM >= 4.5) reasons.push(`High waves (${w.waveHeightM.toFixed(1)} m)`);
  if (w.visibilityKm <= 4) reasons.push(`Poor visibility (${w.visibilityKm.toFixed(1)} km)`);
  if (uncertainty >= 35) reasons.push('High forecast uncertainty');
  if (reasons.length === 0) reasons.push('Conditions within normal operating envelope');
  return { score: Math.round(score * 10) / 10, level: levelFor(score), components: c, reasons };
}

export function riskForRoute(route: RouteWaypoint[], tHours: number): RiskResult {
  if (route.length === 0) return { score: 0, level: 'LOW', components: { seaIce: 0, iceberg: 0, weather: 0, ocean: 0, uncertainty: 0 }, reasons: ['Empty route'] };
  const samples = route.filter((_, i) => i % Math.max(1, Math.floor(route.length / 24)) === 0);
  let sum = 0; let worst = samples[0] ? riskAtPoint(samples[0].lat, samples[0].lon, tHours) : null;
  const agg = { seaIce: 0, iceberg: 0, weather: 0, ocean: 0, uncertainty: 0 };
  for (const s of samples) {
    const r = riskAtPoint(s.lat, s.lon, tHours);
    sum += r.score;
    agg.seaIce += r.components.seaIce; agg.iceberg += r.components.iceberg;
    agg.weather += r.components.weather; agg.ocean += r.components.ocean; agg.uncertainty += r.components.uncertainty;
    if (!worst || r.score > worst.score) worst = r;
  }
  const n = samples.length || 1;
  const avg = sum / n;
  let mx = 0;
  for (const s of samples) mx = Math.max(mx, riskAtPoint(s.lat, s.lon, tHours).score);
  const blended = 0.55 * avg + 0.45 * mx;
  const reasons = [...new Set((worst?.reasons ?? []).slice(0, 4))];
  return {
    score: Math.round(blended * 10) / 10, level: levelFor(blended),
    components: { seaIce: agg.seaIce / n, iceberg: agg.iceberg / n, weather: agg.weather / n, ocean: agg.ocean / n, uncertainty: agg.uncertainty / n },
    reasons
  };
}

export function riskOverTime(route: RouteWaypoint[], steps = [0, 6, 12, 24, 36, 48, 72]): { t: number; score: number; level: RiskLevel }[] {
  return steps.map((t) => { const r = riskForRoute(route, t); return { t, score: Math.round(r.score), level: r.level }; });
}

// Lookahead: does any iceberg's forecast position (t..t+fwdH) fall inside the
// route corridor (within uncertainty + margin)? Returns the closest such hit.
export function routeLookahead(route: RouteWaypoint[], tHours: number, fwdH = 12, marginKm = 15): { id: string; distKm: number; atH: number } | null {
  let best: { id: string; distKm: number; atH: number } | null = null;
  for (let f = 0; f <= fwdH; f += 6) {
    const at = Math.min(72, tHours + f);
    for (const ib of ICEBERGS) {
      const p = icebergPositionAt(ib, at);
      const r = uncertaintyRadiusKm(at);
      const d = distToRouteKm(p, route);
      if (d <= r + marginKm && (!best || d - r < best.distKm - uncertaintyRadiusKm(best.atH))) {
        best = { id: ib.id, distKm: d, atH: at };
      }
    }
  }
  return best;
}
