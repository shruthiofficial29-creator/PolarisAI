import { useState } from 'react';
import { Bot } from 'lucide-react';
import { SUGGESTED, answerQuestion } from '../../services/assistantService';
import { useMission } from '../../state/useMission';

export default function PolarisAssistant() {
  const m = useMission();
  const [msgs, setMsgs] = useState<{ q: string; a: string }[]>([]);
  const [input, setInput] = useState('');
  const ask = (q: string) => {
    const a = answerQuestion(q, {
      tHours: m.tHours, vessel: m.vessel, routes: m.routes,
      activeRouteId: m.activeRouteId, routeRiskLabel: m.activeRoute?.riskLevel ?? '—', rerouted: m.rerouted
    });
    setMsgs((prev) => [...prev.slice(-5), { q, a }]);
  };
  return (
    <div className="card p-3 text-xs">
      <div className="mb-2 flex items-center gap-1.5 text-sm font-bold"><Bot size={16} className="text-cyan-300" /> POLARIS AI (rule-based, offline)</div>
      <div className="mb-2 flex flex-wrap gap-1">
        {SUGGESTED.map((s) => (
          <button key={s} onClick={() => ask(s)} className="rounded border border-cyan-800 bg-cyan-950/50 px-2 py-1 text-[11px] text-cyan-200 hover:bg-cyan-900">{s}</button>
        ))}
      </div>
      <div className="scroll-thin max-h-40 space-y-1.5 overflow-y-auto">
        {msgs.map((x, i) => (
          <div key={i}><div className="text-cyan-200">› {x.q}</div><div className="text-slate-200">{x.a}</div></div>
        ))}
      </div>
      <div className="mt-2 flex gap-1">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && input.trim()) { ask(input.trim()); setInput(''); } }}
          placeholder="Ask about risk, routes, icebergs…" className="flex-1 rounded border border-[#1e3a5f] bg-[#0a1628] p-1.5" />
        <button onClick={() => { if (input.trim()) { ask(input.trim()); setInput(''); } }} className="rounded bg-cyan-600 px-3 font-bold">Ask</button>
      </div>
    </div>
  );
}
