// Scripted forecast hazard zone (demo): an ice-convergence risk area sitting
// just NORTH of the direct track, so northerly detours must swing wide around
// it while the direct (fast) track passes south of it. Grows with lead time.
export function hazardZone(lat: number, lon: number, tHours: number): number {
  const cLat = -60.6, cLon = 59.0;
  const dLat = (lat - cLat) / 1.6;
  // longitude degrees shrink with latitude; compensate roughly
  const dLon = ((lon - cLon) * 0.55) / 2.6;
  const g = Math.exp(-(dLat * dLat + dLon * dLon));
  const growth = Math.min(1, 0.25 + tHours / 40);
  const box1 = g * 75 * growth;
  // Second convergence zone on the western (Maitri) corridor.
  const eLat = (lat + 62.5) / 1.8;
  const eLon = ((lon - 30.0) * 0.55) / 3.0;
  const box2 = Math.exp(-(eLat * eLat + eLon * eLon)) * 62 * growth;
  return Math.min(100, box1 + box2);
}
