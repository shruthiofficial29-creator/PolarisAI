import { Ship } from 'lucide-react';
import { useMission } from '../state/useMission';

export default function Landing() {
  const { setPage } = useMission();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a1628] px-6 text-center text-white">
      <div className="mb-2 rounded bg-amber-500 px-3 py-1 text-xs font-bold text-black">DEMO MODE — Simulated Data</div>
      <Ship size={44} className="mb-3 text-cyan-300" />
      <h1 className="text-4xl font-bold tracking-widest">POLARIS</h1>
      <p className="mt-1 text-lg text-cyan-200">AI-Powered Antarctic Navigation Intelligence</p>
      <p className="mt-1 text-sm text-slate-300">Predict. Assess. Navigate.</p>
      <p className="mt-4 max-w-xl text-sm text-slate-300">
        An intelligent decision-support platform for forecasting sea-ice conditions, predicting iceberg trajectories,
        assessing navigation risks, and identifying safer and fuel-efficient routes for Antarctic research vessels.
      </p>
      <button onClick={() => setPage('dashboard')} className="mt-6 rounded bg-cyan-500 px-8 py-3 font-bold text-black hover:bg-cyan-400">
        Launch Navigation Console
      </button>
      <p className="mt-4 max-w-md text-[11px] text-slate-500">Decision support only. The qualified vessel operator makes the final navigation decision. SIH 2026 · Problem 26059 · MoES/NCPOR prototype.</p>
    </div>
  );
}
