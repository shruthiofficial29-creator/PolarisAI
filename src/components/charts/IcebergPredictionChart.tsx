import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ICEBERGS } from '../../data/icebergs';
import { icebergPositionAt } from '../../services/icebergTrajectoryService';
import { haversineKm } from '../../services/geo';
import { VESSEL } from '../../data/vessel';

export default function IcebergPredictionChart() {
  const steps = [0, 12, 24, 48, 72];
  const data = steps.map((t) => {
    const row: any = { t: `+${t}H` };
    for (const ib of ICEBERGS) {
      const p = icebergPositionAt(ib, t);
      row[ib.id] = Math.round(haversineKm(VESSEL.startLat, VESSEL.startLon, p.lat, p.lon));
    }
    return row;
  });
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Predicted Iceberg Distance from Start (km)</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}><CartesianGrid stroke="#1e3a5f" /><XAxis dataKey="t" stroke="#94a3b8" fontSize={10} /><YAxis stroke="#94a3b8" fontSize={10} /><Tooltip contentStyle={{ background: '#0f2038' }} />
          <Line dataKey="A-23" stroke="#ef4444" strokeWidth={2} dot={false} /><Line dataKey="B-17" stroke="#22d3ee" dot={false} /><Line dataKey="C-09" stroke="#94a3b8" dot={false} /><Line dataKey="D-41" stroke="#f59e0b" dot={false} /><Line dataKey="E-12" stroke="#22c55e" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
