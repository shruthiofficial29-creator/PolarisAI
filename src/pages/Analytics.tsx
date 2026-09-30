import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import ForecastChart from '../components/charts/ForecastChart';
import RiskOverTimeChart from '../components/charts/RiskOverTimeChart';
import RouteComparisonChart from '../components/charts/RouteComparisonChart';
import IcebergPredictionChart from '../components/charts/IcebergPredictionChart';
import { useMission } from '../state/useMission';
import { corridorAverage } from '../services/seaIceForecastService';
import { TIME_STEPS } from '../data/scenario';

export default function Analytics() {
  const m = useMission();
  // Actual vs predicted sea-ice: predicted corridor vs slightly perturbed "actual" (deterministic offset)
  const iceData = TIME_STEPS.map((t) => ({ t: `+${t}H`, predicted: Math.round(corridorAverage(t)), actual: Math.round(corridorAverage(t) + 2 * Math.sin(t)) }));
  const fuelData = m.routes.map((r) => ({ name: r.label.split(' ')[0], fuel: r.fuelPct, eta: Math.round(r.etaHours) }));
  return (
    <div className="space-y-3 p-3">
      <div className="card p-3 text-xs"><span className="rounded bg-slate-600 px-2 py-1 font-bold">PROTOTYPE / SIMULATION METRICS</span>
        <span className="ml-2 text-slate-300">All charts computed from the deterministic demo model — not observations.</span></div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="card p-3 text-xs"><div className="mb-1 text-sm font-bold">Actual vs Predicted Sea-Ice (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={iceData}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="t" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{ background: '#0f2038' }} /><Line dataKey="predicted" stroke="#22d3ee" strokeWidth={2} /><Line dataKey="actual" stroke="#94a3b8" strokeDasharray="4 3" /></LineChart>
          </ResponsiveContainer></div>
        <IcebergPredictionChart />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <ForecastChart />
        <RiskOverTimeChart />
      </div>
      <RouteComparisonChart />
      <div className="card p-3 text-xs"><div className="mb-1 text-sm font-bold">Fuel & Travel Time by Route</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={fuelData}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="name" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{ background: '#0f2038' }} /><Bar dataKey="fuel" fill="#f59e0b" name="fuel %" /><Bar dataKey="eta" fill="#22d3ee" name="ETA h" /></BarChart>
        </ResponsiveContainer></div>
    </div>
  );
}
