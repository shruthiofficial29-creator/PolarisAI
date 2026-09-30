import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { VESSEL } from '../data/vessel';
import { STATIONS } from '../data/stations';
import { getEnvironment } from '../services/environment';
import { optimizeRoutes, vesselPositionAlongRoute } from '../services/routeOptimizationService';
import { riskForRoute, riskAtPoint, routeLookahead } from '../services/riskService';
import { generateAlerts } from '../services/alertService';
import { seaIceForecast } from '../services/seaIceForecastService';
import { icebergPositionAt, uncertaintyRadiusKm } from '../services/icebergTrajectoryService';
import { haversineKm, distToRouteKm } from '../services/geo';
import type { Alert, MissionPriority, RouteOption } from '../types';

export type Page = 'landing' | 'dashboard' | 'seaice' | 'icebergs' | 'routes' | 'sim' | 'analytics';

interface Layers { seaIce: boolean; iceEdge: boolean; icebergs: boolean; trajectories: boolean; uncertainty: boolean; weather: boolean; currents: boolean; risk: boolean; routes: boolean; stations: boolean; }

interface MissionCtx {
  page: Page; setPage: (p: Page) => void;
  tHours: number; setTHours: (t: number) => void;
  destinationId: string; setDestinationId: (s: string) => void;
  priority: MissionPriority; setPriority: (p: MissionPriority) => void;
  routes: RouteOption[]; activeRouteId: string | null;
  activeRoute: RouteOption | null;
  originalRoute: RouteOption | null; updatedRoutes: RouteOption[];
  showRerouteModal: boolean; setShowRerouteModal: (b: boolean) => void;
  rerouted: boolean;
  vessel: { lat: number; lon: number };
  vesselRisk: ReturnType<typeof riskAtPoint>;
  alerts: Alert[];
  layers: Layers; setLayers: (l: Layers) => void;
  selectedIceberg: string | null; setSelectedIceberg: (s: string | null) => void;
  vesselSelected: boolean; setVesselSelected: (b: boolean) => void;
  simPlaying: boolean; setSimPlaying: (b: boolean) => void;
  simSpeed: number; setSimSpeed: (n: number) => void;
  demoRunning: boolean;
  forecast: ReturnType<typeof seaIceForecast>;
  analyzeMission: (adopt?: RouteOption['id']) => void;
  adoptRoute: (id: string) => void;
  runSimulation: () => void; resetSim: () => void;
  adoptUpdated: () => void;
  runDemo: () => void;
  demoStep: string;
}

const Ctx = createContext<MissionCtx | null>(null);

const DEFAULT_LAYERS: Layers = { seaIce: true, iceEdge: true, icebergs: true, trajectories: true, uncertainty: true, weather: false, currents: false, risk: true, routes: true, stations: true };

export function MissionProvider({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>('landing');
  const [tHours, setTHoursState] = useState(0);
  const [destinationId, setDestinationId] = useState('bharati');
  const [priority, setPriority] = useState<MissionPriority>('BALANCED');
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [originalRoute, setOriginalRoute] = useState<RouteOption | null>(null);
  const [updatedRoutes, setUpdatedRoutes] = useState<RouteOption[]>([]);
  const [showRerouteModal, setShowRerouteModal] = useState(false);
  const [rerouted, setRerouted] = useState(false);
  const [layers, setLayers] = useState<Layers>(DEFAULT_LAYERS);
  const [selectedIceberg, setSelectedIceberg] = useState<string | null>(null);
  const [vesselSelected, setVesselSelected] = useState(false);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simSpeed, setSimSpeed] = useState(1); // sim-hours per real second base (48H in ~48s at 1x)
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoStep, setDemoStep] = useState('');
  const timer = useRef<number | null>(null);
  const demoTimers = useRef<number[]>([]);

  const setTHours = useCallback((t: number) => setTHoursState(Math.max(0, Math.min(72, Math.round(t)))), []);

  const dest = STATIONS.find((s) => s.id === destinationId) ?? STATIONS[0];

  const activeRoute = useMemo(() => {
    if (rerouted && updatedRoutes.length) return updatedRoutes.find((r) => r.id === activeRouteId) ?? updatedRoutes[0];
    return routes.find((r) => r.id === activeRouteId) ?? null;
  }, [routes, updatedRoutes, activeRouteId, rerouted]);

  const vessel = useMemo(() => {
    if (activeRoute && activeRoute.waypoints.length > 1 && tHours > 0) {
      const p = vesselPositionAlongRoute(activeRoute.waypoints, tHours);
      return { lat: p.lat, lon: p.lon };
    }
    return { lat: VESSEL.startLat, lon: VESSEL.startLon };
  }, [activeRoute, tHours]);

  const vesselRisk = useMemo(() => riskAtPoint(vessel.lat, vessel.lon, tHours), [vessel, tHours]);

  const alerts = useMemo(
    () => generateAlerts(vessel, activeRoute ? activeRoute.waypoints : null, tHours),
    [vessel, activeRoute, tHours]
  );

  const forecast = useMemo(() => seaIceForecast(), []);

  const analyzeMission = useCallback((adopt: RouteOption['id'] = 'balanced') => {
    const to = { lat: dest.destLat, lon: dest.destLon };
    const from = { lat: VESSEL.startLat, lon: VESSEL.startLon };
    const rs = optimizeRoutes(from, to, 0);
    setRoutes(rs);
    setUpdatedRoutes([]);
    setRerouted(false);
    setOriginalRoute(null);
    // map priority -> preset
    const map: Record<MissionPriority, RouteOption['id']> = {
      'SAFETY FIRST': 'safe', BALANCED: 'balanced', 'FUEL EFFICIENCY': 'fast', 'TIME PRIORITY': 'fast'
    };
    setActiveRouteId(adopt === 'balanced' ? map[priority] ?? 'balanced' : adopt);
    setTHoursState(0);
    setShowRerouteModal(false);
  }, [dest, priority]);

  const adoptRoute = useCallback((id: string) => {
    setActiveRouteId(id);
    if (rerouted) {
      // adopting from updated list keeps rerouted flag
    } else {
      // adopting initial route sets it as original for later comparison
      setRoutes((prev) => prev);
    }
  }, [rerouted]);

  // simulation tick
  useEffect(() => {
    if (!simPlaying) return;
    const iv = window.setInterval(() => {
      setTHoursState((prev) => {
        const next = Math.min(48, prev + simSpeed * 0.25);
        return Math.round(next * 10) / 10;
      });
    }, 250);
    timer.current = iv;
    return () => window.clearInterval(iv);
  }, [simPlaying, simSpeed]);

  // reroute trigger check: predicted intersection lookahead + risk levels.
  // The vessel meets local hotspots (A-23 uncertainty zone) that a whole-route
  // average would dilute, so the lookahead drives the +40-48H story beat.
  useEffect(() => {
    if (!activeRoute || rerouted || showRerouteModal) return;
    const routeR = riskForRoute(activeRoute.waypoints, tHours);
    const vesselR = riskAtPoint(vessel.lat, vessel.lon, tHours);
    const worst = Math.max(routeR.score, vesselR.score);
    const hit = routeLookahead(activeRoute.waypoints, tHours, 12, 15);
    if ((tHours >= 40 && hit) || worst >= 61 || tHours >= 48) {
      triggerReroute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tHours, activeRoute]);

  const triggerReroute = useCallback(() => {
    if (!activeRoute) return;
    setSimPlaying(false);
    const to = { lat: dest.destLat, lon: dest.destLon };
    const upd = optimizeRoutes({ lat: vessel.lat, lon: vessel.lon }, to, tHours);
    setUpdatedRoutes(upd);
    if (!originalRoute) setOriginalRoute(activeRoute);
    setShowRerouteModal(true);
  }, [activeRoute, dest, vessel, tHours, originalRoute]);

  const runSimulation = useCallback(() => {
    if (!routes.length) analyzeMission('fast');
    else setActiveRouteId('fast');
    setTHoursState(0);
    setRerouted(false); setUpdatedRoutes([]); setOriginalRoute(null); setShowRerouteModal(false);
    setSimPlaying(true);
  }, [routes, analyzeMission]);

  const resetSim = useCallback(() => {
    setSimPlaying(false); setTHoursState(0);
    setShowRerouteModal(false); setRerouted(false); setUpdatedRoutes([]); setOriginalRoute(null);
  }, []);

  const adoptUpdated = useCallback(() => {
    const safe = updatedRoutes.find((r) => r.id === 'safe') ?? updatedRoutes[0];
    if (safe) setActiveRouteId(safe.id);
    setRerouted(true);
    setShowRerouteModal(false);
    setSimPlaying(false);
  }, [updatedRoutes]);

  const runDemo = useCallback(() => {
    // scripted story 30-60s
    demoTimers.current.forEach((t) => window.clearTimeout(t));
    demoTimers.current = [];
    const after = (ms: number, fn: () => void) => { demoTimers.current.push(window.setTimeout(fn, ms)); };
    setDemoRunning(true);
    setPage('dashboard');
    setDestinationId('bharati');
    after(300, () => { setDemoStep('Selecting Bharati + analyzing mission…'); analyzeMission('balanced'); });
    after(4000, () => { setDemoStep('Three routes computed — adopting FAST route…'); setActiveRouteId('fast'); });
    after(7000, () => { setDemoStep('Running 48-hour simulation…'); setTHoursState(0); setSimPlaying(true); setSimSpeed(6); });
    after(34000, () => {
      setDemoStep('Reroute required — computing updated routes…');
      setSimPlaying(false);
    });
    after(38000, () => { setDemoStep('Adopting updated SAFE route. Demo complete.'); adoptUpdatedRef.current?.(); setDemoRunning(false); setDemoStep(''); });
  }, [analyzeMission]);

  const adoptUpdatedRef = useRef<() => void>(() => {});
  adoptUpdatedRef.current = () => {
    // recompute if needed then adopt safe
    setTHoursState((cur) => {
      const t = cur >= 48 ? cur : 48;
      return t;
    });
    // force trigger reroute computation from current vessel pos
    setTimeout(() => {
      const act = routes.find((r) => r.id === 'fast') ?? routes[0];
      const to = { lat: dest.destLat, lon: dest.destLon };
      const pos = act ? vesselPositionAlongRoute(act.waypoints, 48) : { lat: VESSEL.startLat, lon: VESSEL.startLon };
      const upd = optimizeRoutes({ lat: pos.lat, lon: pos.lon }, to, 48);
      setUpdatedRoutes(upd);
      setOriginalRoute(act ?? null);
      const safe = upd.find((r) => r.id === 'safe') ?? upd[0];
      if (safe) setActiveRouteId(safe.id);
      setRerouted(true);
      setShowRerouteModal(false);
      setSimPlaying(false);
    }, 100);
  };

  // expose env snapshot for components if needed
  void getEnvironment; void icebergPositionAt; void uncertaintyRadiusKm; void haversineKm; void distToRouteKm;

  const value: MissionCtx = {
    page, setPage, tHours, setTHours, destinationId, setDestinationId, priority, setPriority,
    routes: rerouted && updatedRoutes.length ? updatedRoutes : routes, activeRouteId, activeRoute,
    originalRoute, updatedRoutes, showRerouteModal, setShowRerouteModal, rerouted,
    vessel, vesselRisk, alerts, layers, setLayers, selectedIceberg, setSelectedIceberg,
    vesselSelected, setVesselSelected, simPlaying, setSimPlaying, simSpeed, setSimSpeed,
    demoRunning, forecast, analyzeMission, adoptRoute, runSimulation, resetSim, adoptUpdated, runDemo, demoStep
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMission(): MissionCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useMission outside provider');
  return c;
}
