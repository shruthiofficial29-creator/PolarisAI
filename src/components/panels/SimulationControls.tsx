import { useMission } from '../../state/useMission';
import { phaseForTime } from '../../services/simulationService';

export default function SimulationControls() {
  const m = useMission();
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">48-Hour Simulation <span className="ml-1 font-normal text-slate-400">phase: {phaseForTime(m.tHours)}</span></div>
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => m.runSimulation()} className="rounded bg-orange-600 px-3 py-1.5 font-bold text-white hover:bg-orange-500">RUN 48-HOUR SIMULATION</button>
        <button onClick={() => m.runDemo()} className="rounded bg-cyan-500 px-3 py-1.5 font-bold text-black hover:bg-cyan-400">RUN POLARIS DEMO</button>
        <button onClick={() => m.setSimPlaying(!m.simPlaying)} className="rounded border border-[#1e3a5f] px-3 py-1.5">{m.simPlaying ? 'Pause' : 'Play'}</button>
        <button onClick={() => m.resetSim()} className="rounded border border-[#1e3a5f] px-3 py-1.5">Reset</button>
        <label className="flex items-center gap-1">Speed
          <select value={m.simSpeed} onChange={(e) => m.setSimSpeed(Number(e.target.value))} className="rounded border border-[#1e3a5f] bg-[#0a1628] p-1">
            <option value={1}>1×</option><option value={2}>2×</option><option value={4}>4×</option>
          </select>
        </label>
      </div>
      {m.demoRunning && <div className="mt-1 text-cyan-200">DEMO: {m.demoStep}</div>}
      <div className="mt-2 h-2 overflow-hidden rounded bg-[#0a1628]"><div className="h-full bg-cyan-400" style={{ width: `${(Math.min(48, m.tHours) / 48) * 100}%` }} /></div>
    </div>
  );
}
