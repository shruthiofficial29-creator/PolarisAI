import { useMission } from '../../state/useMission';

export default function WhyThisRoute() {
  const m = useMission();
  if (!m.activeRoute) return <div className="card p-3 text-xs text-slate-400">Why-this-route explanation appears after analysis.</div>;
  return (
    <div className="card p-3 text-xs">
      <div className="mb-1 text-sm font-bold">Why this route? ({m.activeRoute.label})</div>
      <ul className="list-disc pl-4">{m.activeRoute.whyThisRoute.map((w, i) => <li key={i}>{w}</li>)}</ul>
      <div className="mt-1 text-slate-400">Hazards: {m.activeRoute.hazardsAvoided.join(' · ')}</div>
    </div>
  );
}
