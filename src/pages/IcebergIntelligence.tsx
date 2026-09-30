import { ICEBERGS } from '../data/icebergs';
import { icebergPositionAt, uncertaintyRadiusKm } from '../services/icebergTrajectoryService';
import AntarcticMap from '../components/map/AntarcticMap';
import IcebergPanel from '../components/panels/IcebergPanel';
import IcebergPredictionChart from '../components/charts/IcebergPredictionChart';
import TimeSlider from '../components/panels/TimeSlider';
import { useMission } from '../state/useMission';

export default function IcebergIntelligence() {
  const m = useMission();
  return (
    <div className="space-y-3 p-3">
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3"><AntarcticMap compact /></div>
        <div className="space-y-3 lg:col-span-2">
          <TimeSlider />
          <div className="card p-3 text-xs">
            <div className="mb-1 text-sm font-bold">Tracked Icebergs (5)</div>
            <table className="w-full text-left"><thead><tr className="text-slate-400"><th>ID</th><th>Pos</th><th>±km</th><th>Size</th></tr></thead>
              <tbody>{ICEBERGS.map((ib) => { const p = icebergPositionAt(ib, m.tHours); return (
                <tr key={ib.id} onClick={() => m.setSelectedIceberg(ib.id)} className={`cursor-pointer hover:bg-[#1e3a5f] ${m.selectedIceberg === ib.id ? 'bg-cyan-950' : ''}`}>
                  <td className="font-bold">{ib.id}</td><td>{p.lat.toFixed(1)}, {p.lon.toFixed(1)}</td><td>{uncertaintyRadiusKm(m.tHours).toFixed(0)}</td><td>{ib.sizeKm2} km²</td>
                </tr>); })}</tbody></table>
          </div>
          <IcebergPanel />
        </div>
      </div>
      <IcebergPredictionChart />
    </div>
  );
}
