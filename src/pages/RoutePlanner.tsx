import AntarcticMap from '../components/map/AntarcticMap';
import MissionPlanner from '../components/panels/MissionPlanner';
import RouteComparison from '../components/panels/RouteComparison';
import WhyThisRoute from '../components/panels/WhyThisRoute';
import RouteComparisonChart from '../components/charts/RouteComparisonChart';

export default function RoutePlanner() {
  return (
    <div className="space-y-3 p-3">
      <div className="grid gap-3 lg:grid-cols-4">
        <div><MissionPlanner /><div className="mt-3"><WhyThisRoute /></div></div>
        <div className="lg:col-span-3"><AntarcticMap /></div>
      </div>
      <RouteComparison />
      <RouteComparisonChart />
    </div>
  );
}
