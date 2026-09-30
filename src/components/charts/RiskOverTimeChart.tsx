import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { riskOverTime } from '../../services/riskService';
import { useMission } from '../../state/useMission';

export default function RiskOverTimeChart() {
  const m = useMission();
  const data = m.activeRoute
    ? riskOverTime(m.activeRoute.waypoints).map((d) => ({ t: `+${d.t}H`, score: d.score }))
    : [];
  if (!data.length) return <div className="card p-3 text-xs text-slate-400">Analyze a mission to see risk over time.</div>;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Risk Over Time (active route)</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="t" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} /><Tooltip contentStyle={{ background: '#0f2038' }} /><Line dataKey="score" stroke="#f97316" strokeWidth={2} dot /></LineChart>
      </ResponsiveContainer>
    </div>
  );
}
