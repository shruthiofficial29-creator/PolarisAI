import AntarcticMap from '../components/map/AntarcticMap';
import TimeSlider from '../components/panels/TimeSlider';
import ForecastChart from '../components/charts/ForecastChart';
import { useMission } from '../state/useMission';

export default function SeaIceForecast() {
  const m = useMission();
  return (
    <div className="space-y-3 p-3">
      <div className="card p-3 text-xs"><span className="rounded bg-amber-800 px-2 py-1 font-bold text-amber-200">DEMO FORECAST</span>
        <span className="ml-2 text-slate-300">Deterministic demo model — corridor NOW {m.forecast.corridorConcentration[0]}% → 24H {m.forecast.corridorConcentration[3]}% → 48H {m.forecast.corridorConcentration[4]}% → 72H {m.forecast.corridorConcentration[5]}% · {m.forecast.trend}</span>
      </div>
      <div className="grid gap-3 lg:grid-cols-5">
        <div className="lg:col-span-3"><AntarcticMap compact /></div>
        <div className="space-y-3 lg:col-span-2"><TimeSlider /><ForecastChart /></div>
      </div>
    </div>
  );
}
