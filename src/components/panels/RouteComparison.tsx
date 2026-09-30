import { useMission } from '../../state/useMission';

export default function RouteComparison() {
  const m = useMission();
  if (!m.routes.length) return <div className="card p-3 text-xs text-slate-400">No routes yet — run ANALYZE MISSION.</div>;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-2 text-sm font-bold">Route Comparison</div>
      <div className="grid gap-2 md:grid-cols-3">
        {m.routes.map((r) => (
          <div key={r.id} className={`rounded-lg border p-2 ${m.activeRouteId === r.id ? 'border-cyan-400 bg-cyan-950/40' : 'border-[#1e3a5f]'}`}>
            <div className="font-bold">{r.label}</div>
            <div>{r.distanceKm} km · ETA {r.etaHours.toFixed(1)} h · fuel {r.fuelPct}%</div>
            <div>Safety {r.safetyScore}/100 · <b>{r.riskLevel} ({r.riskScore.toFixed(0)})</b></div>
            <button onClick={() => m.adoptRoute(r.id)} className="mt-1.5 w-full rounded bg-cyan-600 py-1 font-bold text-white hover:bg-cyan-500">
              {m.activeRouteId === r.id ? 'ACTIVE ✓' : 'Adopt this route'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
