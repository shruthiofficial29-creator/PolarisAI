import { Ship, Radio } from 'lucide-react';
import { useMission } from '../../state/useMission';

export default function Header() {
  const { tHours } = useMission();
  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-[#1e3a5f] bg-[#0f2038] px-4 py-2.5">
      <div className="flex items-center gap-2">
        <Ship size={20} className="text-cyan-300" />
        <div>
          <div className="text-sm font-bold tracking-widest">POLARIS</div>
          <div className="text-[11px] text-slate-400">Antarctic Navigation Intelligence</div>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 rounded bg-emerald-900/60 px-2 py-1 text-emerald-300"><Radio size={12} /> SYSTEM ONLINE</span>
        <span className="rounded bg-amber-900/60 px-2 py-1 text-amber-300">DEMO MODE</span>
        <span className="rounded bg-[#1e3a5f] px-2 py-1 text-slate-300">T+{Math.round(tHours)}H · LAST UPDATED SIM</span>
      </div>
    </header>
  );
}
