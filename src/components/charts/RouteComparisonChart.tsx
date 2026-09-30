import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMission } from '../../state/useMission';

export default function RouteComparisonChart() {
  const m = useMission();
  const data = m.routes.map((r) => ({ name: r.label.split(' ')[0], km: r.distanceKm, eta: Math.round(r.etaHours), fuel: r.fuelPct, safety: r.safetyScore }));
  if (!data.length) return <div className="card p-3 text-xs text-slate-400">No routes to compare.</div>;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Route Comparison (km / h / % fuel / safety)</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{ background: '#0f2038' }} /><Bar dataKey="safety" fill="#22d3ee" name="safety" /><Bar dataKey="fuel" fill="#f59e0b" name="fuel %" /></BarChart>
      </ResponsiveContainer>
      <div className="text-slate-400">{m.routes.map((r) => `${r.label}: ${r.distanceKm} km, ETA ${r.etaHours.toFixed(1)} h`).join(' · ')}</div>
    </div>
  );
}
