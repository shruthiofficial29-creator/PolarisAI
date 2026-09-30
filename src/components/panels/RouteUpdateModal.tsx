import { useMission } from '../../state/useMission';

export default function RouteUpdateModal() {
  const m = useMission();
  if (!m.showRerouteModal) return null;
  const orig = m.originalRoute ?? m.activeRoute;
  const upd = m.updatedRoutes.find((r) => r.id === 'safe') ?? m.updatedRoutes[0];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="card max-w-lg p-4 text-xs">
        <div className="mb-1 text-base font-bold text-amber-300">⚠ ROUTE UPDATE REQUIRED</div>
        <p>Predicted iceberg movement creates a high-risk intersection with the current route.</p>
        {orig && upd && (
          <div className="mt-2 rounded border border-[#1e3a5f] p-2">
            <div className="font-bold">ORIGINAL ({orig.label}) vs UPDATED ({upd.label})</div>
            <div>Distance: {orig.distanceKm} → {upd.distanceKm} km ({upd.distanceKm - orig.distanceKm >= 0 ? '+' : ''}{upd.distanceKm - orig.distanceKm} km)</div>
            <div>Risk: {orig.riskScore.toFixed(0)} → {upd.riskScore.toFixed(0)} (−{(orig.riskScore - upd.riskScore).toFixed(0)})</div>
            <div>ETA: {orig.etaHours.toFixed(1)} → {upd.etaHours.toFixed(1)} h · Fuel: {orig.fuelPct}% → {upd.fuelPct}%</div>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <button onClick={() => m.adoptUpdated()} className="flex-1 rounded bg-emerald-500 py-2 font-bold text-black">Adopt updated route</button>
          <button onClick={() => m.setShowRerouteModal(false)} className="rounded border border-[#1e3a5f] px-3">Dismiss</button>
        </div>
      </div>
    </div>
  );
}
