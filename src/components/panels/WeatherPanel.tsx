import { getEnvironment } from '../../services/environment';
import { useMission } from '../../state/useMission';

export default function WeatherPanel() {
  const m = useMission();
  const w = getEnvironment(m.tHours).weatherAt(m.vessel.lat, m.vessel.lon);
  const cards: [string, string][] = [
    [`Wind ${w.windSpeedKmh.toFixed(0)} km/h ${w.windDirLabel}`, `${w.windDirDeg}°`],
    [`Waves ${w.waveHeightM.toFixed(1)} m`, `vis ${w.visibilityKm.toFixed(1)} km`],
    [`Air ${w.airTempC.toFixed(1)}°C`, `SST ${w.sstC.toFixed(1)}°C`],
    [`Current ${w.currentSpeedMs.toFixed(2)} m/s`, `${w.currentDirDeg}°`]
  ];
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {cards.map(([a, b], i) => (
        <div key={i} className="card p-2.5 text-xs"><div className="font-semibold">{a}</div><div className="text-slate-400">{b} · T+{Math.round(m.tHours)}H</div></div>
      ))}
    </div>
  );
}
