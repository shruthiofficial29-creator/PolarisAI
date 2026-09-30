export const TIME_STEPS = [0, 6, 12, 24, 48, 72];
export const SIM_END_H = 48;
export const REROUTE_TRIGGER_H = 48;
// Corridor aggregate targets (illustrative, demo-tuned)
export const CORRIDOR_TARGETS: Record<number, number> = { 0: 42, 6: 45, 12: 49, 24: 58, 48: 67, 72: 72 };
export const DEMO_PHASES = [
  { t: 0, label: 'Departure on Fast route' },
  { t: 12, label: 'A-23 closing in' },
  { t: 24, label: 'Sea-ice rising' },
  { t: 36, label: 'A-23 near planned route' },
  { t: 48, label: 'Risk HIGH — reroute required' }
];
