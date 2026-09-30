import { useMission, Page } from '../../state/useMission';

const TABS: { id: Page; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'seaice', label: 'Sea-Ice Forecast' },
  { id: 'icebergs', label: 'Icebergs' },
  { id: 'routes', label: 'Route Planner' },
  { id: 'sim', label: 'Simulation' },
  { id: 'analytics', label: 'Analytics' }
];

export default function NavTabs() {
  const { page, setPage } = useMission();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-[#1e3a5f] bg-[#0a1628] px-3 py-2">
      {TABS.map((t) => (
        <button key={t.id} onClick={() => setPage(t.id)}
          className={`rounded px-3 py-1.5 text-xs font-medium ${page === t.id ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-700' : 'text-slate-300 hover:bg-[#0f2038] border border-transparent'}`}>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
