import { STATIONS } from '../../data/stations';
import { useMission } from '../../state/useMission';
import type { MissionPriority } from '../../types';

export default function MissionPlanner() {
  const m = useMission();
  return (
    <div className="card p-3 text-xs">
      <div className="mb-2 text-sm font-bold">Mission Planner</div>
      <label className="mb-1 block text-slate-400">Destination</label>
      <select value={m.destinationId} onChange={(e) => m.setDestinationId(e.target.value)} className="mb-2 w-full rounded border border-[#1e3a5f] bg-[#0a1628] p-1.5">
        {STATIONS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.destLat.toFixed(1)}°S, {s.destLon.toFixed(1)}°E offshore)</option>)}
      </select>
      <label className="mb-1 block text-slate-400">Departure (sim)</label>
      <input type="datetime-local" defaultValue="2026-02-10T06:00" className="mb-2 w-full rounded border border-[#1e3a5f] bg-[#0a1628] p-1.5" />
      <label className="mb-1 block text-slate-400">Priority</label>
      <select value={m.priority} onChange={(e) => m.setPriority(e.target.value as MissionPriority)} className="mb-3 w-full rounded border border-[#1e3a5f] bg-[#0a1628] p-1.5">
        {['SAFETY FIRST', 'BALANCED', 'FUEL EFFICIENCY', 'TIME PRIORITY'].map((p) => <option key={p}>{p}</option>)}
      </select>
      <button onClick={() => m.analyzeMission()} className="w-full rounded bg-cyan-500 py-2 font-bold text-black hover:bg-cyan-400">ANALYZE MISSION</button>
      {m.routes.length > 0 && <div className="mt-2 text-emerald-300">3 routes computed · recommended: {m.activeRoute?.label}</div>}
    </div>
  );
}
