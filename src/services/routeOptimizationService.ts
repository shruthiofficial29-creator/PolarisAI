import { haversineKm, pointInPolygon, distToRouteKm } from './geo';
import { seaIceConcentration } from './seaIceForecastService';
import { icebergPositionAt, uncertaintyRadiusKm } from './icebergTrajectoryService';
import { weatherAt } from './weatherService';
import { riskForRoute } from './riskService';
import { ANTARCTICA_POLYGON } from '../data/antarctica';
import { hazardZone } from './hazardZone';
import { ICEBERGS } from '../data/icebergs';
import { VESSEL } from '../data/vessel';
import type { RouteOption, RouteWaypoint } from '../types';

const SPEED_KMH = 12 * 1.852; // 22.224
const FUEL_L_PER_KM = 140;

interface GridNode { i: number; j: number; lat: number; lon: number; }

// Adaptive grid bounds, fitted per mission (from/to bbox + margin) so both
// Bharati (east) and Maitri (west) missions get well-resolved cost grids.
const NLAT = 56, NLON = 72;
let LAT_MIN = -70.5, LAT_MAX = -55.5, LON_MIN = 38, LON_MAX = 82;

function fitGrid(from: { lat: number; lon: number }, to: { lat: number; lon: number }): void {
  LAT_MAX = Math.min(-54.5, Math.max(from.lat, to.lat) + 2.5);
  LAT_MIN = Math.max(-71.5, Math.min(from.lat, to.lat) - 2.5);
  LON_MIN = Math.min(from.lon, to.lon) - 7;
  LON_MAX = Math.max(from.lon, to.lon) + 7;
}

function gridPoint(i: number, j: number): GridNode {
  return {
    i, j,
    lat: LAT_MAX - ((LAT_MAX - LAT_MIN) * i) / (NLAT - 1),
    lon: LON_MIN + ((LON_MAX - LON_MIN) * j) / (NLON - 1)
  };
}

function isLand(lat: number, lon: number): boolean {
  if (lat > -66.5) return false; // open ocean north — skip expensive test
  return pointInPolygon(lat, lon, ANTARCTICA_POLYGON);
}

interface Preset { riskMult: number; latPenalty: number; fuelW: number; hazW: number; }

const PRESETS: Record<RouteOption['id'], Preset> = {
  safe: { riskMult: 3.0, latPenalty: 14, fuelW: 0.15, hazW: 1.8 },
  balanced: { riskMult: 1.0, latPenalty: 2.5, fuelW: 0.5, hazW: 0.45 },
  fast: { riskMult: 0.22, latPenalty: 0, fuelW: 1.0, hazW: 0.05 }
};

function cellRisk(lat: number, lon: number, t: number): number {
  const si = seaIceConcentration(lat, lon, t);
  let ib = 0;
  for (const b of ICEBERGS) {
    const p = icebergPositionAt(b, t);
    const r = uncertaintyRadiusKm(t);
    const d = haversineKm(lat, lon, p.lat, p.lon);
    const v = d <= r ? 95 : 95 * Math.exp(-(d - r) / 70);
    ib = Math.max(ib, (v * b.baseRisk) / 100);
  }
  const w = weatherAt(lat, lon, t);
  const wx = (w.windSpeedKmh / 70) * 60 + (w.waveHeightM / 8) * 40;
  return si * 0.42 + ib * 0.42 + Math.min(100, wx) * 0.16;
}

function segmentBlocked(a: GridNode, b: GridNode): boolean {
  const steps = 6;
  for (let k = 1; k < steps; k++) {
    const lat = a.lat + ((b.lat - a.lat) * k) / steps;
    const lon = a.lon + ((b.lon - a.lon) * k) / steps;
    if (isLand(lat, lon)) return true;
  }
  return isLand(b.lat, b.lon);
}

function nearestCell(lat: number, lon: number): GridNode {
  const i = Math.round(((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * (NLAT - 1));
  const j = Math.round(((lon - LON_MIN) / (LON_MAX - LON_MIN)) * (NLON - 1));
  return gridPoint(Math.max(0, Math.min(NLAT - 1, i)), Math.max(0, Math.min(NLON - 1, j)));
}

export let lastAstarIters = 0;
export let lastAstarRawLen = 0;

function astar(start: GridNode, goal: GridNode, t0: number, preset: Preset): GridNode[] {
  const key = (i: number, j: number) => i * 1000 + j;
  const open: { k: number; f: number }[] = [{ k: key(start.i, start.j), f: 0 }];
  const g = new Map<number, number>([[key(start.i, start.j), 0]]);
  const came = new Map<number, number>();
  const nodeMap = new Map<number, GridNode>([[key(start.i, start.j), start]]);
  const closed = new Set<number>();
  const goalNode = goal;

  const pop = (): number => {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[bi].f) bi = i;
    return open.splice(bi, 1)[0].k;
  };

  let iter = 0;
  while (open.length && iter++ < 20000) {
    const cur = pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    const cn = nodeMap.get(cur)!;
    if (cn.i === goalNode.i && cn.j === goalNode.j) {
      const path: GridNode[] = [cn];
      let c = cur;
      while (came.has(c)) { c = came.get(c)!; path.unshift(nodeMap.get(c)!); }
      lastAstarIters = iter; lastAstarRawLen = path.length;
      return path;
    }
    const gCur = g.get(cur)!;
    const tCur = t0 + (gCur / Math.max(1, SPEED_KMH)) * 0.5; // rough time-aware
    for (let di = -1; di <= 1; di++) for (let dj = -1; dj <= 1; dj++) {
      if (!di && !dj) continue;
      const ni = cn.i + di, nj = cn.j + dj;
      if (ni < 0 || nj < 0 || ni >= NLAT || nj >= NLON) continue;
      const nb = gridPoint(ni, nj);
      if (segmentBlocked(cn, nb)) continue;
      const dist = haversineKm(cn.lat, cn.lon, nb.lat, nb.lon);
      const risk = cellRisk(nb.lat, nb.lon, Math.min(72, tCur));
      const hz = hazardZone(nb.lat, nb.lon, Math.min(72, tCur));
      const latPen = Math.max(0, -nb.lat - 60.5) * preset.latPenalty;
      const stepCost = dist * (1 + preset.fuelW * 0.15) + ((risk * preset.riskMult + hz * preset.hazW) * dist) / 16 + latPen * (dist / 40);
      const nk = key(ni, nj);
      const ng = gCur + stepCost;
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng); came.set(nk, cur); nodeMap.set(nk, nb);
        const h = haversineKm(nb.lat, nb.lon, goalNode.lat, goalNode.lon);
        open.push({ k: nk, f: ng + h });
      }
    }
  }
  lastAstarIters = iter; lastAstarRawLen = 2;
  return [start, goal]; // fallback straight line
}

function pathRisk(lat: number, lon: number): number {
  // risk proxy used by simplify (mid-horizon environment, balanced view)
  return cellRisk(lat, lon, 24) + hazardZone(lat, lon, 24) * 1.0;
}

function maxRiskAlong(aLat: number, aLon: number, bLat: number, bLon: number, steps = 8): number {
  let mx = 0;
  for (let k = 0; k <= steps; k++) {
    const lat = aLat + ((bLat - aLat) * k) / steps;
    const lon = aLon + ((bLon - aLon) * k) / steps;
    mx = Math.max(mx, pathRisk(lat, lon));
  }
  return mx;
}

function simplify(points: GridNode[]): GridNode[] {
  if (points.length < 3) return points;
  const out: GridNode[] = [points[0]];
  let anchor = 0;
  for (let i = 2; i <= points.length; i++) {
    const end = points[Math.min(i, points.length - 1)];
    let blocked = false;
    // land check
    const steps = 10;
    for (let k = 1; k < steps; k++) {
      const lat = points[anchor].lat + ((end.lat - points[anchor].lat) * k) / steps;
      const lon = points[anchor].lon + ((end.lon - points[anchor].lon) * k) / steps;
      if (isLand(lat, lon)) { blocked = true; break; }
    }
    // risk check: don't cut a corner that the planner deliberately routed around
    if (!blocked) {
      const directMax = maxRiskAlong(points[anchor].lat, points[anchor].lon, end.lat, end.lon);
      let pathMax = 0;
      for (let s = anchor; s < Math.min(i, points.length - 1); s++) {
        pathMax = Math.max(pathMax, maxRiskAlong(points[s].lat, points[s].lon, points[s + 1].lat, points[s + 1].lon));
      }
      if (directMax > pathMax + 9) blocked = true;
    }
    if (blocked || i === points.length) { out.push(points[i - 1]); anchor = i - 1; }
  }
  // dedupe + ensure goal
  const last = points[points.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

function buildRoute(id: RouteOption['id'], label: string, from: { lat: number; lon: number }, to: { lat: number; lon: number }, t0: number, why: string[]): RouteOption {
  const preset = PRESETS[id];
  // clamp into grid
  const cFrom = { lat: Math.max(LAT_MIN, Math.min(LAT_MAX, from.lat)), lon: Math.max(LON_MIN, Math.min(LON_MAX, from.lon)) };
  const cTo = { lat: Math.max(LAT_MIN, Math.min(LAT_MAX, to.lat)), lon: Math.max(LON_MIN, Math.min(LON_MAX, to.lon)) };
  const path = simplify(astar(nearestCell(cFrom.lat, cFrom.lon), nearestCell(cTo.lat, cTo.lon), t0, preset));
  const waypoints: RouteWaypoint[] = [{ lat: from.lat, lon: from.lon },
    ...path.map((p) => ({ lat: Math.round(p.lat * 1000) / 1000, lon: Math.round(p.lon * 1000) / 1000 })),
    { lat: to.lat, lon: to.lon }];
  // remove consecutive duplicates
  const wp = waypoints.filter((w, i) => i === 0 || Math.abs(w.lat - waypoints[i - 1].lat) > 1e-6 || Math.abs(w.lon - waypoints[i - 1].lon) > 1e-6);
  let dist = 0;
  for (let i = 1; i < wp.length; i++) dist += haversineKm(wp[i - 1].lat, wp[i - 1].lon, wp[i].lat, wp[i].lon);
  const eta = dist / SPEED_KMH;
  const fuelPct = (dist * FUEL_L_PER_KM) / VESSEL.fuelCapacityL * 100;
  const risk = riskForRoute(wp, Math.min(72, t0 + 24)); // fixed horizon: fair comparison across routes
  const safetyScore = Math.round(100 - risk.score);
  const hazards: string[] = [];
  for (const b of ICEBERGS) {
    const steps = [0, 12, 24, 48, 72].map((t) => icebergPositionAt(b, Math.min(72, t0 + t)));
    const dmin = Math.min(...steps.map((p) => distToRouteKm(p, wp)));
    if (dmin > 55) hazards.push(`Keeps ${dmin.toFixed(0)} km clear of ${b.id}`);
    else if (id === 'safe') hazards.push(`Routes around ${b.id} uncertainty zone`);
  }
  if (hazards.length === 0) hazards.push('No major hazards avoided on this track');
  return {
    id, label, waypoints: wp,
    distanceKm: Math.round(dist), etaHours: Math.round(eta * 10) / 10,
    fuelPct: Math.round(fuelPct * 10) / 10,
    safetyScore, riskLevel: risk.level, riskScore: risk.score,
    hazardsAvoided: hazards.slice(0, 3), whyThisRoute: why
  };
}

export function optimizeRoutes(from: { lat: number; lon: number }, to: { lat: number; lon: number }, t0 = 0): RouteOption[] {
  fitGrid(from, to);
  const safe = buildRoute('safe', 'SAFETY FIRST', from, to, t0, [
    'Maximises clearance from iceberg uncertainty zones and heavy ice.',
    'Stays in more northerly open water where concentration is lower.',
    'Accepts extra distance and fuel for the lowest route risk.'
  ]);
  const balanced = buildRoute('balanced', 'BALANCED', from, to, t0, [
    'Trades a moderate detour for materially lower risk than the direct track.',
    'Balances ETA, fuel burn and exposure to forecast uncertainty.',
    'Recommended default when mission priority is BALANCED.'
  ]);
  const fast = buildRoute('fast', 'FAST / FUEL', from, to, t0, [
    'Shortest track: minimum distance, ETA and fuel burn.',
    'Passes closest to the forecast A-23 uncertainty zone — watch +36–48h.',
    'Choose only with active monitoring and a ready fallback route.'
  ]);
  return [safe, balanced, fast];
}

export function vesselPositionAlongRoute(route: RouteWaypoint[], elapsedH: number): { lat: number; lon: number; progress: number } {
  const totalKm = routeTotalKm(route);
  let travel = Math.min(totalKm, elapsedH * SPEED_KMH);
  for (let i = 1; i < route.length; i++) {
    const seg = haversineKm(route[i - 1].lat, route[i - 1].lon, route[i].lat, route[i].lon);
    if (travel <= seg) {
      const f = seg === 0 ? 0 : travel / seg;
      return { lat: route[i - 1].lat + (route[i].lat - route[i - 1].lat) * f, lon: route[i - 1].lon + (route[i].lon - route[i - 1].lon) * f, progress: (totalKm - travel + seg * (1 - f)) / totalKm };
    }
    travel -= seg;
  }
  const last = route[route.length - 1];
  return { lat: last.lat, lon: last.lon, progress: 1 };
}

export function routeTotalKm(route: RouteWaypoint[]): number {
  let d = 0;
  for (let i = 1; i < route.length; i++) d += haversineKm(route[i - 1].lat, route[i - 1].lon, route[i].lat, route[i].lon);
  return d;
}
