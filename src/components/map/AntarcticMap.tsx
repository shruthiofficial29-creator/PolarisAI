import { useMemo, useRef, useState } from 'react';
import { project } from '../../services/geo';
import { ANTARCTICA_POLYGON } from '../../data/antarctica';
import { STATIONS } from '../../data/stations';
import { ICEBERGS } from '../../data/icebergs';
import { getEnvironment } from '../../services/environment';
import { icebergPositionAt, uncertaintyRadiusKm, trajectorySteps } from '../../services/icebergTrajectoryService';
import { seaIceGrid, iceEdge } from '../../services/seaIceForecastService';
import { weatherAt } from '../../services/weatherService';
import { riskAtPoint } from '../../services/riskService';
import { useMission } from '../../state/useMission';
import LayerControl from './LayerControl';
import MapControls from './MapControls';

const R = 900, CX = 500, CY = 500;
const P = (lat: number, lon: number) => project(lat, lon, R, CX, CY);

function pathFrom(points: { x: number; y: number }[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)} Z`).join(' ');
}

const ROUTE_COLORS: Record<string, string> = { safe: '#22c55e', balanced: '#22d3ee', fast: '#facc15' };

export default function AntarcticMap({ compact = false }: { compact?: boolean }) {
  const m = useMission();
  const { tHours, layers, activeRoute, routes, originalRoute, rerouted } = m;
  const [vb, setVb] = useState({ x: 120, y: 130, w: 760, h: 560 });
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const env = useMemo(() => getEnvironment(tHours), [tHours]);
  void env;

  const landPath = useMemo(() => pathFrom(ANTARCTICA_POLYGON.map((p) => P(p.lat, p.lon))), []);
  const iceCells = useMemo(() => (layers.seaIce ? seaIceGrid(tHours, compact ? 26 : 40, compact ? 34 : 52) : []), [tHours, layers.seaIce, compact]);
  const edge = useMemo(() => (layers.iceEdge ? iceEdge(tHours) : []), [tHours, layers.iceEdge]);

  const zoom = (f: number) =>
    setVb((v) => {
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      const w = Math.max(120, Math.min(1400, v.w * f)), h = Math.max(90, Math.min(1100, v.h * f));
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  const reset = () => setVb({ x: 120, y: 130, w: 760, h: 560 });
  const fullscreen = () => { const el = boxRef.current; if (el) { if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.(); } };

  // scale factor: svg units per km approx (for uncertainty circles)
  const kmToSvg = 1.35;

  const riskDots = useMemo(() => {
    if (!layers.risk || !activeRoute) return [];
    return activeRoute.waypoints.filter((_, i) => i % 2 === 0).map((w) => {
      const r = riskAtPoint(w.lat, w.lon, tHours);
      if (r.score < 45) return null;
      const p = P(w.lat, w.lon);
      return { x: p.x, y: p.y, score: r.score };
    }).filter(Boolean) as { x: number; y: number; score: number }[];
  }, [activeRoute, tHours, layers.risk]);

  return (
    <div ref={boxRef} className="card relative overflow-hidden bg-[#071120]">
      <div className="flex items-center gap-2 border-b border-[#1e3a5f] px-3 py-2 text-xs">
        <span className="font-semibold text-cyan-200">Southern Ocean — South Polar View</span>
        <span className="ml-auto text-slate-400">T+{Math.round(tHours)}H · SVG offline (no tiles)</span>
      </div>
      <div className="relative">
        <svg
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          className="h-[520px] w-full cursor-grab select-none"
          onWheel={(e) => zoom(e.deltaY > 0 ? 1.15 : 0.87)}
          onMouseDown={(e) => { drag.current = { sx: e.clientX, sy: e.clientY, ox: vb.x, oy: vb.y }; }}
          onMouseMove={(e) => {
            // Capture everything synchronously: the setVb updater below runs
            // later (and twice in StrictMode), after drag.current may be null.
            const d = drag.current;
            if (!d) return;
            const { sx, sy, ox, oy } = d;
            const scale = vb.w / 800;
            const cx = e.clientX, cy = e.clientY;
            setVb((v) => ({ ...v, x: ox - (cx - sx) * scale, y: oy - (cy - sy) * scale }));
          }}
          onMouseUp={() => { drag.current = null; }}
          onMouseLeave={() => { drag.current = null; }}
        >
          <rect x={-2000} y={-2000} width={5000} height={5000} fill="#0b1e3a" />
          {/* graticule */}
          {[-60, -70, -80].map((la) => {
            const r = R * Math.tan(((90 + la) * Math.PI) / 360);
            return <circle key={la} cx={CX} cy={CY} r={r} fill="none" stroke="#1e3a5f" strokeWidth={1} strokeDasharray="4 4" />;
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180;
            return <line key={i} x1={CX} y1={CY} x2={CX + 700 * Math.sin(a)} y2={CY - 700 * Math.cos(a)} stroke="#14294a" strokeWidth={1} />;
          })}
          {/* sea ice cells */}
          {layers.seaIce && iceCells.map((c, i) => {
            if (c.c < 18) return null;
            const p = P(c.lat, c.lon);
            const op = Math.min(0.75, (c.c / 100) * 0.85);
            const fill = c.c > 65 ? '#7dd3fc' : c.c > 40 ? '#38bdf8' : '#155e86';
            return <rect key={i} x={p.x - 7} y={p.y - 7} width={14} height={14} fill={fill} opacity={op} />;
          })}
          {/* land */}
          <path d={landPath} fill="#334155" stroke="#94a3b8" strokeWidth={1.5} />
          <text x={CX} y={CY + 8} textAnchor="middle" fontSize={16} fill="#cbd5e1" opacity={0.8}>ANTARCTICA</text>
          {/* ice edge */}
          {layers.iceEdge && edge.length > 1 && (
            <polyline points={edge.map((e) => { const p = P(e.lat, e.lon); return `${p.x},${p.y}`; }).join(' ')}
              fill="none" stroke="#22d3ee" strokeWidth={2} strokeDasharray="6 3" opacity={0.9} />
          )}
          {/* risk dots */}
          {riskDots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={7} fill={d.score >= 81 ? '#ef4444' : d.score >= 61 ? '#f97316' : '#eab308'} opacity={0.45} />
          ))}
          {/* weather / currents sample arrows */}
          {layers.weather && [-58, -61, -64, -67].map((la) =>
            [45, 55, 65, 75].map((lo) => {
              const w = weatherAt(la, lo, tHours);
              const p = P(la, lo);
              const a = (w.windDirDeg * Math.PI) / 180;
              return (
                <g key={`${la}-${lo}`} opacity={0.8}>
                  <line x1={p.x} y1={p.y} x2={p.x + 14 * Math.sin(a)} y2={p.y - 14 * Math.cos(a)} stroke="#fbbf24" strokeWidth={1.5} />
                  <text x={p.x + 2} y={p.y - 4} fontSize={8} fill="#fde68a">{w.windSpeedKmh.toFixed(0)}</text>
                </g>
              );
            })
          )}
          {layers.currents && [-59, -62, -65].map((la) =>
            [45, 55, 65, 75].map((lo) => {
              const w = weatherAt(la, lo, tHours);
              const p = P(la, lo);
              const a = (w.currentDirDeg * Math.PI) / 180;
              return <line key={`c${la}-${lo}`} x1={p.x} y1={p.y + 8} x2={p.x + 16 * Math.sin(a)} y2={p.y + 8 - 16 * Math.cos(a)} stroke="#34d399" strokeWidth={1.5} opacity={0.8} />;
            })
          )}
          {/* routes */}
          {layers.routes && routes.map((r) => {
            const pts = r.waypoints.map((w) => { const p = P(w.lat, w.lon); return `${p.x},${p.y}`; }).join(' ');
            const isActive = activeRoute?.id === r.id;
            return (
              <g key={r.id}>
                {r.id === 'safe' && <polyline points={pts} fill="none" stroke={ROUTE_COLORS[r.id]} strokeWidth={isActive ? 5 : 2.5} opacity={isActive ? 0.95 : 0.55} strokeDasharray={isActive ? '' : '7 4'} />}
                {r.id !== 'safe' && <polyline points={pts} fill="none" stroke={ROUTE_COLORS[r.id]} strokeWidth={isActive ? 5 : 2.5} opacity={isActive ? 0.95 : 0.55} strokeDasharray={isActive ? '' : '7 4'} />}
              </g>
            );
          })}
          {/* original vs updated emphasis when rerouted */}
          {rerouted && originalRoute && (
            <polyline points={originalRoute.waypoints.map((w) => { const p = P(w.lat, w.lon); return `${p.x},${p.y}`; }).join(' ')}
              fill="none" stroke="#64748b" strokeWidth={2} strokeDasharray="3 4" opacity={0.8} />
          )}
          {/* stations */}
          {layers.stations && STATIONS.map((s) => {
            const p = P(s.lat, s.lon); const d = P(s.destLat, s.destLon);
            return (
              <g key={s.id}>
                <line x1={p.x} y1={p.y} x2={d.x} y2={d.y} stroke="#94a3b8" strokeDasharray="2 2" />
                <circle cx={d.x} cy={d.y} r={5} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
                <rect x={p.x - 5} y={p.y - 5} width={10} height={10} fill="#f59e0b" stroke="#000" />
                <text x={p.x + 8} y={p.y - 6} fontSize={11} fill="#fde68a" fontWeight={700}>{s.name}</text>
              </g>
            );
          })}
          {/* icebergs */}
          {layers.icebergs && ICEBERGS.map((ib) => {
            const pos = icebergPositionAt(ib, tHours);
            const p = P(pos.lat, pos.lon);
            const sel = m.selectedIceberg === ib.id;
            return (
              <g key={ib.id} onClick={(e) => { e.stopPropagation(); m.setSelectedIceberg(ib.id); }} className="cursor-pointer">
                {layers.uncertainty && (
                  <circle cx={p.x} cy={p.y} r={uncertaintyRadiusKm(tHours) * kmToSvg} fill="#38bdf8" opacity={0.14} stroke="#38bdf8" strokeDasharray="4 3" />
                )}
                {layers.trajectories && (
                  <polyline points={trajectorySteps(ib).map((s) => { const q = P(s.lat, s.lon); return `${q.x},${q.y}`; }).join(' ')}
                    fill="none" stroke="#7dd3fc" strokeWidth={1.2} strokeDasharray="5 3" opacity={0.8} />
                )}
                <polygon points={`${p.x},${p.y - 8} ${p.x + 7},${p.y} ${p.x},${p.y + 8} ${p.x - 7},${p.y}`} fill={ib.id === 'A-23' ? '#ef4444' : '#e2e8f0'} stroke="#000" strokeWidth={sel ? 2.5 : 1} />
                <text x={p.x + 9} y={p.y + 4} fontSize={10} fill="#fff" fontWeight={700}>{ib.id}</text>
              </g>
            );
          })}
          {/* vessel */}
          {(() => { const p = P(m.vessel.lat, m.vessel.lon); return (
            <g onClick={(e) => { e.stopPropagation(); m.setVesselSelected(true); }} className="cursor-pointer">
              <circle cx={p.x} cy={p.y} r={13} fill="#22d3ee" opacity={0.25} />
              <circle cx={p.x} cy={p.y} r={6} fill="#22d3ee" stroke="#fff" strokeWidth={1.5} />
              <text x={p.x + 10} y={p.y - 8} fontSize={10} fill="#a5f3fc" fontWeight={700}>RV POLARIS</text>
            </g>); })()}
        </svg>
        <div className="absolute left-2 top-2"><LayerControl /></div>
        <div className="absolute right-2 top-2"><MapControls onZoom={zoom} onReset={reset} onFullscreen={fullscreen} /></div>
        <div className="absolute bottom-2 left-2 flex gap-2 text-[10px]">
          <span className="rounded bg-black/60 px-2 py-1"><span className="text-green-400">━</span> SAFE</span>
          <span className="rounded bg-black/60 px-2 py-1"><span className="text-cyan-300">━</span> BALANCED</span>
          <span className="rounded bg-black/60 px-2 py-1"><span className="text-yellow-300">━</span> FAST</span>
        </div>
      </div>
    </div>
  );
}
