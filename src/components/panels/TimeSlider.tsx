import { TIME_STEPS } from '../../data/scenario';
import { useMission } from '../../state/useMission';

export default function TimeSlider() {
  const m = useMission();
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 flex items-center gap-2">
        <span className="text-sm font-bold">Mission Time</span>
        <span className="rounded bg-[#1e3a5f] px-2 py-0.5">T+{Number(m.tHours).toFixed(m.tHours % 1 ? 1 : 0)}H</span>
      </div>
      <input type="range" min={0} max={72} step={1} value={Math.round(m.tHours)} onChange={(e) => m.setTHours(Number(e.target.value))} className="w-full accent-cyan-400" />
      <div className="mt-1 flex gap-1">
        {TIME_STEPS.map((t) => (
          <button key={t} onClick={() => m.setTHours(t)} className={`flex-1 rounded border px-1 py-1 ${Math.round(m.tHours) === t ? 'border-cyan-400 bg-cyan-900/50' : 'border-[#1e3a5f]'}`}>
            {t === 0 ? 'NOW' : `+${t}H`}
          </button>
        ))}
      </div>
    </div>
  );
}
