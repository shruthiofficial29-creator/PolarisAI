# POLARIS — AI-Powered Antarctic Navigation Intelligence

**Predict. Assess. Navigate.** · SIH 2026 Problem 26059 (MoES / NCPOR) prototype.

> **DEMO MODE — Simulated Data.** All forecasts are deterministic demo models. Decision support only — the qualified vessel operator makes the final navigation decision.

## Run (frontend only, offline)

```bash
cd polaris
npm install
npm run dev      # → http://localhost:5173
npm run build    # production check
```

No API keys, no network calls at runtime. Custom SVG south-polar map (no tiles).

## 21-step demo script

1. Open app → Landing → **Launch Navigation Console**.
2. Note persistent **DEMO MODE** banner + human-in-the-loop footer.
3. Map shows Antarctica, RV POLARIS (58°S 50°E), Bharati/Maitri, 5 icebergs.
4. Toggle layers (sea-ice, trajectories, uncertainty, weather, currents, risk…).
5. Zoom (wheel/buttons), pan (drag), Reset, Fullscreen.
6. Mission Planner → destination **Bharati**, priority **BALANCED** → **ANALYZE MISSION**.
7. Three routes appear: SAFE (green, north detour) / BALANCED (cyan) / FAST (yellow, direct).
8. Route Comparison shows distance, ETA, fuel %, safety, risk. **Why this route?** explains.
9. Click **Adopt this route** on FAST (or it auto-adopts for simulation).
10. Time slider NOW → +72H: icebergs drift, uncertainty circles grow, sea-ice + risk rise, weather worsens.
11. Click vessel → position/speed/fuel/ETA/risk. Click A-23 → trajectory + intersection check.
12. Sea-Ice Forecast page → **DEMO FORECAST**, ice edge, confidence, chart.
13. Iceberg Intelligence → table, trajectories, detail panel, prediction chart.
14. Press **RUN 48-HOUR SIMULATION** (vessel animates 0→48H on Fast route).
15. +12H: A-23 closing · +24H: ice rising · +36H: A-23 near route.
16. +48H: risk crosses HIGH → simulation pauses → **⚠ ROUTE UPDATE REQUIRED**.
17. Comparison card: ORIGINAL vs UPDATED (distance Δ, risk reduction, time Δ, fuel Δ).
18. Click **Adopt updated route** → vessel continues on SAFE track (grey dashed = original).
19. POLARIS AI chips: ask all 5 questions (risky? safest? nearest? next 24h? why reroute?).
20. Analytics page → **PROTOTYPE / SIMULATION METRICS** (4+ charts).
21. Or one click: **RUN POLARIS DEMO** scripts steps 6–18 in ~40 s.

## Architecture

DATA → `environment.ts getEnvironment(t)` (pure fn of t, 0–72H) → riskService → routeOptimizationService (A*) → simulationService → `useMission` store → UI → human navigator.

## Swapping in real models

Each `src/services/*.ts` is pure TypeScript with a narrow interface (e.g. `seaIceConcentration(lat,lon,t)`, `icebergPositionAt(ib,t)`, `riskAtPoint(...)`, `optimizeRoutes(...)`). Replace the body with an ML inference call or a `fetch()` to the optional FastAPI backend (`backend/main.py` mirrors the same schemas) without touching components — they only consume return types.

## Backend (optional, Phase 7)

```bash
cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

Frontend keeps working with local services if the backend is down.
