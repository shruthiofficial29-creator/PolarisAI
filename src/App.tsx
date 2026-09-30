import { MissionProvider, useMission } from './state/useMission';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import SeaIceForecast from './pages/SeaIceForecast';
import IcebergIntelligence from './pages/IcebergIntelligence';
import RoutePlanner from './pages/RoutePlanner';
import Simulation from './pages/Simulation';
import Analytics from './pages/Analytics';
import Header from './components/layout/Header';
import NavTabs from './components/layout/NavTabs';
import DemoBanner from './components/layout/DemoBanner';

function Shell() {
  const { page } = useMission();
  if (page === 'landing') return <Landing />;
  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <DemoBanner />
      <Header />
      <NavTabs />
      {page === 'dashboard' && <Dashboard />}
      {page === 'seaice' && <SeaIceForecast />}
      {page === 'icebergs' && <IcebergIntelligence />}
      {page === 'routes' && <RoutePlanner />}
      {page === 'sim' && <Simulation />}
      {page === 'analytics' && <Analytics />}
      <footer className="border-t border-[#1e3a5f] px-4 py-3 text-center text-xs text-slate-400">
        Decision support only. The qualified vessel operator makes the final navigation decision. · DEMO MODE — Simulated Data · POLARIS prototype for SIH 2026
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <MissionProvider>
      <Shell />
    </MissionProvider>
  );
}
