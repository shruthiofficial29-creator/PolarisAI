import { riskForRoute, riskAtPoint } from './riskService';
import { icebergPositionAt } from './icebergTrajectoryService';
import { haversineKm } from './geo';
import { ICEBERGS } from '../data/icebergs';
import type { RouteOption } from '../types';

export interface AssistantContext {
  tHours: number;
  vessel: { lat: number; lon: number };
  routes: RouteOption[];
  activeRouteId: string | null;
  routeRiskLabel: string;
  rerouted: boolean;
}

export const SUGGESTED = [
  'Why is the current route risky?',
  'Which route is safest?',
  'Where is the nearest iceberg?',
  'What happens in the next 24 hours?',
  'Why did the system reroute?'
];

export function answerQuestion(q: string, ctx: AssistantContext): string {
  const s = q.toLowerCase();
  const active = ctx.routes.find((r) => r.id === ctx.activeRouteId) ?? ctx.routes[2] ?? ctx.routes[0];

  if (s.includes('risky') || s.includes('why') && s.includes('risk')) {
    if (!active) return 'Analyze a mission first to generate routes, then I can explain route risk.';
    const r = active.whyThisRoute.join(' ');
    return `The active route (${active.label}) scores ${active.riskScore.toFixed(0)}/100 (${active.riskLevel}) at +${ctx.tHours}H. ${r} Highest-risk factors: route crosses rising sea-ice and the forecast A-23 uncertainty zone around +36–48H.`;
  }
  if (s.includes('safest') || s.includes('safe')) {
    const safe = ctx.routes.find((r) => r.id === 'safe');
    if (!safe) return 'No routes yet — click ANALYZE MISSION to compute SAFE / BALANCED / FAST options.';
    return `Safest is ${safe.label}: risk ${safe.riskScore.toFixed(0)}/100 (${safe.riskLevel}), safety ${safe.safetyScore}/100, ${safe.distanceKm} km, ETA ${safe.etaHours} h. ${safe.whyThisRoute[0] ?? ''}`;
  }
  if (s.includes('nearest') || s.includes('iceberg') && s.includes('where')) {
    let best = ''; let bd = Infinity;
    for (const ib of ICEBERGS) {
      const p = icebergPositionAt(ib, ctx.tHours);
      const d = haversineKm(ctx.vessel.lat, ctx.vessel.lon, p.lat, p.lon);
      if (d < bd) { bd = d; best = ib.id; }
    }
    return `Nearest iceberg to the vessel at +${ctx.tHours}H is ${best}, about ${bd.toFixed(0)} km away (drift + current included, uncertainty grows with lead time). Open Iceberg Intelligence for full trajectories.`;
  }
  if (s.includes('24 hours') || s.includes('next')) {
    const t2 = Math.min(72, ctx.tHours + 24);
    const nowR = active ? riskForRoute(active.waypoints, ctx.tHours).score : riskAtPoint(ctx.vessel.lat, ctx.vessel.lon, ctx.tHours).score;
    const futR = active ? riskForRoute(active.waypoints, t2).score : riskAtPoint(ctx.vessel.lat, ctx.vessel.lon, t2).score;
    return `Over the next 24h (to +${t2}H): sea-ice concentration rises along the corridor, A-23 drifts closer to the active track, winds freshen. Route risk moves from ~${nowR.toFixed(0)} to ~${futR.toFixed(0)}/100. If it crosses HIGH, the system will propose a reroute.`;
  }
  if (s.includes('reroute') || s.includes('re-route') || s.includes('update')) {
    if (ctx.rerouted) return 'The system rerouted because the Fast track intersected the forecast A-23 uncertainty zone and route risk crossed HIGH at +48H. Updated routes were recomputed from the vessel current position; adopting the SAFE update restores clearance and lowers risk.';
    return 'No reroute yet. The system proposes a reroute when the active route risk crosses HIGH (e.g. predicted A-23 intersection at +48H). Run the 48-hour simulation to see it trigger.';
  }
  if (s.includes('fuel')) {
    if (!active) return 'Analyze a mission to see fuel estimates.';
    return `Fuel estimates (% of 500,000 L tank): ${ctx.routes.map((r) => `${r.label} ${r.fuelPct}%`).join(' · ')}. Fastest burns least distance but may cost more in heavy ice.`;
  }
  if (s.includes('weather')) return 'Weather/ocean cards show deterministic demo fields for the vessel position and selected time — wind, waves, temperature, current, visibility. Values deteriorate along the scripted scenario.';
  return 'I can explain route risk, safest option, nearest iceberg, the next 24 hours, or why a reroute was proposed. Try one of the suggested questions.';
}
