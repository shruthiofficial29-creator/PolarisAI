import { riskAtPoint, riskForRoute } from './riskService';
import { icebergPositionAt, uncertaintyRadiusKm } from './icebergTrajectoryService';
import { weatherAt } from './weatherService';
import { haversineKm, distToRouteKm } from './geo';
import { ICEBERGS } from '../data/icebergs';
import type { Alert, RouteWaypoint } from '../types';

let seq = 0;

export function generateAlerts(vessel: { lat: number; lon: number }, route: RouteWaypoint[] | null, tHours: number): Alert[] {
  const alerts: Alert[] = [];
  // Iceberg intersection prediction
  for (const ib of ICEBERGS) {
    const p = icebergPositionAt(ib, tHours);
    const r = uncertaintyRadiusKm(tHours);
    const dVessel = haversineKm(vessel.lat, vessel.lon, p.lat, p.lon);
    const dRoute = route ? distToRouteKm(p, route) : Infinity;
    if (route && (dRoute <= r + 25)) {
      alerts.push({
        id: `ib-${ib.id}-${Math.round(tHours)}-${seq++}`, severity: 'HIGH_PRIORITY', timeH: tHours,
        reason: `Predicted iceberg ${ib.id} movement creates a high-risk intersection with the current route (within ${dRoute.toFixed(0)} km).`,
        recommendedAction: 'Recompute routes from current position and adopt the updated SAFE route.'
      });
    } else if (dVessel < 220) {
      alerts.push({
        id: `ibv-${ib.id}-${Math.round(tHours)}-${seq++}`, severity: 'WARNING', timeH: tHours,
        reason: `Iceberg ${ib.id} within ${dVessel.toFixed(0)} km of vessel (uncertainty ±${r.toFixed(0)} km).`,
        recommendedAction: 'Increase lookout, reduce speed in reduced visibility, review fallback route.'
      });
    }
  }
  if (route) {
    const r = riskForRoute(route, tHours);
    if (r.score >= 61) {
      alerts.push({
        id: `risk-${Math.round(tHours)}-${seq++}`, severity: 'HIGH_PRIORITY', timeH: tHours,
        reason: `Active route risk is ${r.level} (${r.score.toFixed(0)}/100): ${r.reasons[0] ?? 'multiple hazards'}.`,
        recommendedAction: 'Adopt an updated lower-risk route from current position.'
      });
    } else if (r.score >= 45) {
      alerts.push({
        id: `riskw-${Math.round(tHours)}-${seq++}`, severity: 'WARNING', timeH: tHours,
        reason: `Sea-ice increasing along route; corridor risk rising (${r.score.toFixed(0)}/100).`,
        recommendedAction: 'Monitor forecast steps +24H/+48H and prepare reroute options.'
      });
    }
  }
  const w = weatherAt(vessel.lat, vessel.lon, tHours);
  if (w.windSpeedKmh >= 50 || w.waveHeightM >= 5) {
    alerts.push({
      id: `wx-${Math.round(tHours)}-${seq++}`, severity: 'WARNING', timeH: tHours,
      reason: `Strong winds ${w.windSpeedKmh.toFixed(0)} km/h ${w.windDirLabel}, waves ${w.waveHeightM.toFixed(1)} m near vessel.`,
      recommendedAction: 'Secure deck ops, consider heading adjustment to reduce crosswind.'
    });
  } else if (w.windSpeedKmh >= 40) {
    alerts.push({
      id: `wxi-${Math.round(tHours)}-${seq++}`, severity: 'INFO', timeH: tHours,
      reason: `Fresh winds ${w.windSpeedKmh.toFixed(0)} km/h ${w.windDirLabel} near vessel.`,
      recommendedAction: 'No action required; continue monitoring.'
    });
  }
  const local = riskAtPoint(vessel.lat, vessel.lon, tHours);
  if (alerts.length === 0) {
    alerts.push({
      id: `ok-${Math.round(tHours)}-${seq++}`, severity: 'INFO', timeH: tHours,
      reason: `Conditions nominal at vessel position (risk ${local.score.toFixed(0)}/100 ${local.level}).`,
      recommendedAction: 'Maintain course and speed.'
    });
  }
  return alerts.slice(0, 6);
}
