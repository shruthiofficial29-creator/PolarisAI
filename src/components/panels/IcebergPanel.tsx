import { ICEBERGS } from '../../data/icebergs';
import { icebergPositionAt, uncertaintyRadiusKm, trajectoryConfidence } from '../../services/icebergTrajectoryService';
import { haversineKm, distToRouteKm } from '../../services/geo';
import { useMission } from '../../state/useMission';

export default function IcebergPanel() {
  const m = useMission();
  const id = m.selectedIceberg;
  if (!id) return <div className="card p-3 text-xs text-slate-400">Click an iceberg (A-23, B-17, C-09, D-41, E-12) on the map for trajectory intelligence.</div>;
  const ib = ICEBERGS.find((b) => b.id === id)!;
  const pos = icebergPositionAt(ib, m.tHours);
  const dV = haversineKm(m.vessel.lat, m.vessel.lon, pos.lat, pos.lon);
  const dR = m.activeRoute ? distToRouteKm(pos, m.activeRoute.waypoints) : null;
  const steps = [0, 12, 24, 48, 72].map((t) => ({ t, ...icebergPositionAt(ib, t) }));
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold">Iceberg {ib.id}</span>
        <button className="text-slate-400" onClick={() => m.setSelectedIceberg(null)}>✕</button>
      </div>
      <div>Size {ib.sizeKm2} km² · mass ~{ib.massMt} Mt · drift {ib.speedKmPerDay} km/day @ {ib.directionDeg}°</div>
      <div className="mt-1">Now(+{Math.round(m.tHours)}H): {pos.lat.toFixed(2)}°S, {pos.lon.toFixed(2)}°E · ±{uncertaintyRadiusKm(m.tHours).toFixed(0)} km · conf {(trajectoryConfidence(m.tHours) * 100).toFixed(0)}%</div>
      <div>Distance from vessel: {dV.toFixed(0)} km · from route: {dR == null ? '—' : `${dR.toFixed(0)} km`}</div>
      <div className={dR != null && dR < 80 ? 'text-red-300 font-bold' : 'text-emerald-300'}>
        {dR != null && dR < 80 ? `Potential route intersection: YES (within ${dR.toFixed(0)} km)` : 'Potential route intersection: none currently'}
      </div>
      <div className="mt-1 text-slate-400">Predicted: {steps.map((s) => `+${s.t}H (${s.lat.toFixed(1)}, ${s.lon.toFixed(1)})`).join(' · ')}</div>
    </div>
  );
}
