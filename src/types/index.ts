export interface LatLon { lat: number; lon: number; }

export interface Station {
  id: string; name: string; lat: number; lon: number;
  destLat: number; destLon: number; description: string;
}

export interface VesselSpec {
  name: string; type: string; polarClass: string;
  maxSpeedKn: number; cruiseSpeedKn: number; fuelCapacityL: number;
  startLat: number; startLon: number;
}

export interface Iceberg {
  id: string; lat: number; lon: number;
  sizeKm2: number; massMt: number;
  speedKmPerDay: number; directionDeg: number; baseRisk: number;
}

export interface IcebergState extends Iceberg {
  curLat: number; curLon: number;
  uncertaintyKm: number;
  distToVesselKm: number;
  distToRouteKm: number | null;
  intersectsRoute: boolean;
  intersectTimeH: number | null;
  riskLevel: RiskLevel;
}

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface RiskResult {
  score: number; level: RiskLevel;
  components: { seaIce: number; iceberg: number; weather: number; ocean: number; uncertainty: number };
  reasons: string[];
}

export interface WeatherState {
  windSpeedKmh: number; windDirDeg: number; windDirLabel: string;
  airTempC: number; sstC: number;
  currentSpeedMs: number; currentDirDeg: number;
  waveHeightM: number; visibilityKm: number;
}

export interface SeaIceForecast {
  steps: number[];
  corridorConcentration: number[];
  confidence: number[];
  trend: string;
  risk: RiskLevel;
}

export interface RouteWaypoint extends LatLon {}

export interface RouteOption {
  id: 'safe' | 'balanced' | 'fast';
  label: string;
  waypoints: RouteWaypoint[];
  distanceKm: number;
  etaHours: number;
  fuelPct: number;
  safetyScore: number;
  riskLevel: RiskLevel;
  riskScore: number;
  hazardsAvoided: string[];
  whyThisRoute: string[];
}

export type MissionPriority = 'SAFETY FIRST' | 'BALANCED' | 'FUEL EFFICIENCY' | 'TIME PRIORITY';

export interface Alert {
  id: string; severity: 'HIGH_PRIORITY' | 'WARNING' | 'INFO';
  timeH: number; reason: string; recommendedAction: string;
}

export interface EnvironmentSnapshot {
  tHours: number;
  seaIceAt: (lat: number, lon: number) => number;
  icebergs: { id: string; lat: number; lon: number; uncertaintyKm: number }[];
  weatherAt: (lat: number, lon: number) => WeatherState;
  confidence: number;
}
