export function phaseForTime(t: number): string {
  if (t < 1) return 'Departure on Fast route';
  if (t < 12) return 'Transit — open water';
  if (t < 24) return 'A-23 closing in';
  if (t < 36) return 'Sea-ice rising';
  if (t < 48) return 'A-23 near planned route';
  return 'Risk HIGH — reroute required';
}

// Simulation advances t 0->48. Returns true when reroute modal should show.
export function shouldTriggerReroute(activeRiskScore: number, t: number): boolean {
  return t >= 48 - 1e-6 || activeRiskScore >= 61;
}
