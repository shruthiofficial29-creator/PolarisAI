import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useMission } from '../../state/useMission';

export default function ForecastChart() {
  const m = useMission();
  const data = m.forecast.steps.map((t, i) => ({ t: `+${t}H`, conc: m.forecast.corridorConcentration[i], conf: m.forecast.confidence[i] }));
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Corridor Sea-Ice Forecast <span className="ml-1 rounded bg-amber-800 px-1 text-amber-200">DEMO FORECAST</span></div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="t" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} /><Tooltip contentStyle={{ background: '#0f2038' }} /><Line dataKey="conc" stroke="#22d3ee" strokeWidth={2} dot name="Concentration %" /></LineChart>
      </ResponsiveContainer>
      <div className="text-slate-400">Trend: {m.forecast.trend} · Confidence {m.forecast.confidence[0]}% → {m.forecast.confidence[m.forecast.confidence.length - 1]}%</div>
    </div>
  );
}
