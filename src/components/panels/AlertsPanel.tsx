import { useMission } from '../../state/useMission';

const SEV: Record<string, string> = { HIGH_PRIORITY: 'bg-red-900/50 text-red-200 border-red-700', WARNING: 'bg-amber-900/40 text-amber-200 border-amber-700', INFO: 'bg-sky-900/40 text-sky-200 border-sky-700' };

export default function AlertsPanel() {
  const m = useMission();
  return (
    <div className="card p-3 text-xs">
      <div className="mb-2 text-sm font-bold">Alerts ({m.alerts.length})</div>
      <div className="scroll-thin max-h-44 space-y-1.5 overflow-y-auto">
        {m.alerts.map((a) => (
          <div key={a.id} className={`rounded border p-2 ${SEV[a.severity]}`}>
            <div className="font-bold">[{a.severity}] T+{a.timeH.toFixed(0)}H — {a.reason}</div>
            <div>Action: {a.recommendedAction}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
