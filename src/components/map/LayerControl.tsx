import { useMission } from '../../state/useMission';

const ITEMS: { key: string; label: string }[] = [
  { key: 'seaIce', label: 'Sea-Ice Concentration' },
  { key: 'iceEdge', label: 'Sea-Ice Forecast (edge)' },
  { key: 'icebergs', label: 'Icebergs' },
  { key: 'trajectories', label: 'Iceberg Trajectories' },
  { key: 'uncertainty', label: 'Uncertainty Zones' },
  { key: 'weather', label: 'Weather' },
  { key: 'currents', label: 'Ocean Currents' },
  { key: 'risk', label: 'Risk Zones' },
  { key: 'routes', label: 'Vessel Route' },
  { key: 'stations', label: 'Research Stations' }
];

export default function LayerControl() {
  const { layers, setLayers } = useMission();
  return (
    <div className="rounded-lg border border-[#1e3a5f] bg-[#0a1628]/90 p-2 text-[11px]">
      <div className="mb-1 font-bold text-slate-300">LAYERS</div>
      {ITEMS.map((it) => (
        <label key={it.key} className="flex cursor-pointer items-center gap-1.5 py-0.5 text-slate-200">
          <input type="checkbox" checked={(layers as any)[it.key]}
            onChange={(e) => setLayers({ ...layers, [it.key]: e.target.checked })} className="accent-cyan-400" />
          {it.label}
        </label>
      ))}
    </div>
  );
}
