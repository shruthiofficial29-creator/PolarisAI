import { VESSEL } from '../../data/vessel';
import { useMission } from '../../state/useMission';

export default function VesselPanel() {
  const m = useMission();
  if (!m.vesselSelected) return (
    <div className="card p-3 text-xs text-slate-400">Click the vessel marker on the map to inspect RV POLARIS. <button className="ml-1 text-cyan-300 underline" onClick={() => m.setVesselSelected(true)}>Open</button></div>
  );
  const r = m.vesselRisk;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-bold">{VESSEL.name}</span>
        <button className="text-slate-400" onClick={() => m.setVesselSelected(false)}>✕</button>
      </div>
      <div className="text-slate-400">{VESSEL.type} · {VESSEL.polarClass} · max {VESSEL.maxSpeedKn} kn</div>
      <div className="mt-2 grid grid-cols-2 gap-1">
        <div>Position: {m.vessel.lat.toFixed(2)}°S, {m.vessel.lon.toFixed(2)}°E</div>
        <div>Speed: {VESSEL.cruiseSpeedKn} kn</div>
        <div>Fuel cap: {(VESSEL.fuelCapacityL / 1000).toFixed(0)}k L</div>
        <div>ETA: {m.activeRoute ? `${m.activeRoute.etaHours.toFixed(1)} h` : '—'}</div>
        <div>Destination: {m.destinationId}</div>
        <div>Risk: <b className={r.level === 'LOW' ? 'text-green-400' : r.level === 'MODERATE' ? 'text-yellow-300' : 'text-red-400'}>{r.score.toFixed(0)} {r.level}</b></div>
      </div>
    </div>
  );
}
