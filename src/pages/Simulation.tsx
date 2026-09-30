import AntarcticMap from '../components/map/AntarcticMap';
import SimulationControls from '../components/panels/SimulationControls';
import RouteUpdateModal from '../components/panels/RouteUpdateModal';
import AlertsPanel from '../components/panels/AlertsPanel';
import RiskPanel from '../components/panels/RiskPanel';
import { useMission } from '../state/useMission';
import { DEMO_PHASES } from '../data/scenario';

export default function Simulation() {
  const m = useMission();
  const orig = m.originalRoute ?? (m.rerouted ? null : m.activeRoute);
  const upd = m.updatedRoutes.find((r) => r.id === 'safe') ?? m.updatedRoutes[0];
  return (
    <div className="space-y-3 p-3">
      <SimulationControls />
      <div className="card flex flex-wrap gap-2 p-3 text-xs">
        {DEMO_PHASES.map((p) => (
          <span key={p.t} className={`rounded border px-2 py-1 ${m.tHours >= p.t ? 'border-cyan-400 bg-cyan-950 text-cyan-200' : 'border-[#1e3a5f] text-slate-400'}`}>+{p.t}H {p.label}</span>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3"><AntarcticMap /></div>
        <div className="space-y-3 lg:col-span-2"><RiskPanel /><AlertsPanel />
          {orig && upd && (m.rerouted || m.showRerouteModal) && (
            <div className="card p-3 text-xs">
              <div className="mb-1 text-sm font-bold">Original vs Updated</div>
              <div>Distance {orig.distanceKm} → {upd.distanceKm} km (Δ {upd.distanceKm - orig.distanceKm >= 0 ? '+' : ''}{upd.distanceKm - orig.distanceKm})</div>
              <div>Risk {orig.riskScore.toFixed(0)} → {upd.riskScore.toFixed(0)} (Δ −{(orig.riskScore - upd.riskScore).toFixed(0)})</div>
              <div>ETA {orig.etaHours.toFixed(1)} → {upd.etaHours.toFixed(1)} h · Fuel {orig.fuelPct}% → {upd.fuelPct}%</div>
              {!m.rerouted && <button onClick={() => m.adoptUpdated()} className="mt-2 w-full rounded bg-emerald-500 py-1.5 font-bold text-black">Adopt updated route</button>}
            </div>
          )}
        </div>
      </div>
      <RouteUpdateModal />
    </div>
  );
}
