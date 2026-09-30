import AntarcticMap from '../components/map/AntarcticMap';
import MissionPlanner from '../components/panels/MissionPlanner';
import VesselPanel from '../components/panels/VesselPanel';
import IcebergPanel from '../components/panels/IcebergPanel';
import WeatherPanel from '../components/panels/WeatherPanel';
import RiskPanel from '../components/panels/RiskPanel';
import RouteComparison from '../components/panels/RouteComparison';
import WhyThisRoute from '../components/panels/WhyThisRoute';
import AlertsPanel from '../components/panels/AlertsPanel';
import TimeSlider from '../components/panels/TimeSlider';
import SimulationControls from '../components/panels/SimulationControls';
import RouteUpdateModal from '../components/panels/RouteUpdateModal';
import PolarisAssistant from '../components/assistant/PolarisAssistant';

export default function Dashboard() {
  return (
    <div className="space-y-3 p-3">
      <div className="grid gap-3 xl:grid-cols-5">
        <div className="space-y-3 xl:col-span-3">
          <AntarcticMap />
          <TimeSlider />
          <SimulationControls />
        </div>
        <div className="space-y-3 xl:col-span-2">
          <MissionPlanner />
          <VesselPanel />
          <RiskPanel />
          <AlertsPanel />
        </div>
      </div>
      <WeatherPanel />
      <div className="grid gap-3 lg:grid-cols-2">
        <RouteComparison />
        <WhyThisRoute />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <IcebergPanel />
        <PolarisAssistant />
      </div>
      <RouteUpdateModal />
    </div>
  );
}
