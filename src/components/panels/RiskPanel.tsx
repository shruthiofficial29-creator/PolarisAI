import { riskForRoute, riskAtPoint, routeLookahead } from '../../services/riskService';
import { useMission } from '../../state/useMission';

const COLOR: Record<string, string> = { LOW: 'text-green-400', MODERATE: 'text-yellow-300', HIGH: 'text-orange-400', CRITICAL: 'text-red-400' };

export default function RiskPanel() {
  const m = useMission();
  const routeR = m.activeRoute ? riskForRoute(m.activeRoute.waypoints, m.tHours) : null;
  const vesselR = riskAtPoint(m.vessel.lat, m.vessel.lon, m.tHours);
  // Headline = worst of route-average and vessel-position risk (vessel encounters local hotspots).
  const r = routeR && routeR.score >= vesselR.score ? routeR : vesselR;
  const look = m.activeRoute ? routeLookahead(m.activeRoute.waypoints, m.tHours, 12, 15) : null;
  const reasons = [...r.reasons];
  if (look) reasons.unshift(`Predicted iceberg ${look.id} intersection within ${look.distKm.toFixed(0)} km (T+${look.atH.toFixed(0)}H)`);
  const subtitle = routeR && vesselR
    ? (r === routeR ? `route avg ${routeR.score.toFixed(0)} · vessel ${vesselR.score.toFixed(0)}` : `vessel ${vesselR.score.toFixed(0)} · route avg ${routeR.score.toFixed(0)}`)
    : undefined;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Navigation Risk <span className="ml-1 text-slate-400">T+{Math.round(m.tHours)}H</span></div>
      <div className={`text-2xl font-bold ${COLOR[r.level]}`}>{r.score.toFixed(0)} <span className="text-sm">{r.level}</span></div>
      {subtitle && <div className="text-slate-400">{subtitle}</div>}
      <div className="mt-1 grid grid-cols-5 gap-1 text-[10px] text-slate-300">
        {Object.entries(r.components).map(([k, v]) => (
          <div key={k} className="rounded bg-[#0a1628] p-1 text-center">{k}<br /><b>{v.toFixed(0)}</b></div>
        ))}
      </div>
      <ul className="mt-2 list-disc pl-4 text-slate-200">{reasons.slice(0, 5).map((x, i) => <li key={i}>{x}</li>)}</ul>
      <div className="mt-1 text-[10px] text-slate-500">risk = 0.30·seaIce + 0.30·iceberg + 0.15·weather + 0.10·ocean + 0.15·uncertainty</div>
    </div>
  );
}
