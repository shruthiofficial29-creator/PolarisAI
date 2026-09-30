import { Plus, Minus, RotateCcw, Maximize } from 'lucide-react';

export default function MapControls({ onZoom, onReset, onFullscreen }: { onZoom: (f: number) => void; onReset: () => void; onFullscreen: () => void }) {
  const btn = 'rounded bg-[#0a1628]/90 border border-[#1e3a5f] p-1.5 text-slate-200 hover:bg-[#1e3a5f]';
  return (
    <div className="flex flex-col gap-1">
      <button className={btn} onClick={() => onZoom(0.8)} title="Zoom in"><Plus size={14} /></button>
      <button className={btn} onClick={() => onZoom(1.25)} title="Zoom out"><Minus size={14} /></button>
      <button className={btn} onClick={onReset} title="Reset"><RotateCcw size={14} /></button>
      <button className={btn} onClick={onFullscreen} title="Fullscreen"><Maximize size={14} /></button>
    </div>
  );
}
