# Surya Jyotish — Core Engines (pure calc, zero UI/API)

No server, no routes, no keys, no chat UI, no 3D/SVG rendering. Import these
modules straight into your new app.

```
chart-engine/
  chartCalculationEngine.js     ⭐ MAIN — pure JS, zero deps. Planets, houses,
                                 dasha, shadbala, varga charts. ~1 arcmin accurate.
  suryaChartPacket.js           — formats a calculated chart into readable text
  astro-python-backend/         — optional: Swiss Ephemeris precision (higher
    app.py                        than Meeus JS above, esp. for retrograde stations)
    ephe/                        — required ephemeris data files, do not delete

prediction-engine/
  yogaDetectionEngine.js        — classical yoga (planetary combination) detection
  transitPredictionEngine.js    — dated transit-to-natal event predictions
  decisionAdaptiveEngine.js     — scoring/timeline/alerts + self-learning weights
  probabilityPredictionEngine.js— event-probability model (marriage/career/etc)

ai-offline-engine/
  oracleContext.js              — maps a full computeFullChart() bundle to real facts/scores
  offlineOracle.js              — fully offline, long-form reading generator (see below)
```

## `ai-offline-engine` — fully offline, on purpose

This used to carry an "Honest flag" warning here because `offlineOracle.js`
picked one of 4 hardcoded generic reading templates at random and never read
the chart data it was passed. That's been rewritten: `oracleContext.js` maps
the full `computeFullChart()` bundle into real facts (current dasha, Moon
placement, every detected yoga, upcoming transits, all five tracked life
domains, Shadbala extremes, a risk composite), and `offlineOracle.js`
composes a long-form (9-section) reading entirely from those facts — the
same numbers the Probabilities and Guidance screens render, never invented
ones. There used to also be an optional "Live Oracle" mode
(`aiOracleConnector.js`) that sent a chart summary to a free text-AI endpoint
purely to re-phrase this same data; that file has been removed entirely so
the Oracle has no network code path at all, under any setting.

## Two tracks for chart calculation — pick one

**Track A (recommended default).** No install, runs in-browser/Node directly.
```js
import { calcKundli, calcDasha, calcShadbala } from './chart-engine/chartCalculationEngine.js';
import { detectYogas }      from './prediction-engine/yogaDetectionEngine.js';
import { buildPredictions } from './prediction-engine/transitPredictionEngine.js';
import { JYOTISH_ENGINE }   from './prediction-engine/decisionAdaptiveEngine.js';

const kundli   = calcKundli(1990, 5, 14, 10, 30, 28.6139, 77.2090, 5.5); // y,m,d,h,min,lat,lon,tzOffset
const dashas   = calcDasha(kundli, '1990-05-14');
const shadbala = calcShadbala(kundli, true); // true = daytime birth
const yogas    = detectYogas(kundli.structured.planets, kundli.structured.lagna.rashiIdx);
// `currentPlanets` = a second calcKundli() call for *today's* date (same lat/lon,
// tzOffset 0) — buildPredictions() needs this to know real current transiting
// positions rather than assuming today's sky matches the birth-time sky.
const todayKundli = calcKundli(new Date().getUTCFullYear(), new Date().getUTCMonth()+1, new Date().getUTCDate(), 0, 0, 28.6139, 77.2090, 0);
const transits = buildPredictions(kundli.structured.planets, dashas, todayKundli.structured.planets);

const result = JYOTISH_ENGINE.runPipeline(
  dashas, transits, yogas,
  Object.entries(shadbala).filter(([k]) => k !== '_aspects').map(([name, v]) => ({ ...v, name })), // `name` lets per-domain scoring filter by planet
  userId
);
// -> { windows, alerts, decisions } — decisions is now genuinely per-domain (see decisionAdaptiveEngine.js's scorePeriodForDomain)

JYOTISH_ENGINE.feedback.collectFeedback(predictionId, 1, 'career'); // learn from outcomes
```

**Track B (higher raw precision).** Needs Python running alongside your app.
```bash
cd chart-engine/astro-python-backend
pip install pyswisseph --break-system-packages
python3 app.py    # serves POST /calculate on :3001 — this is a calc process, not a public API
```
```js
import { predictEvents, formatPredictionBlock } from './prediction-engine/probabilityPredictionEngine.js';
import { buildSuryaChartPacket } from './chart-engine/suryaChartPacket.js';

const chartData = await fetch('http://localhost:3001/calculate', {
  method: 'POST',
  body: JSON.stringify({ year:1990, month:5, day:14, hour:10, minute:30, lat:28.6139, lon:77.2090, tzOffset:5.5 })
}).then(r => r.json());

const predictions   = predictEvents(chartData, chartData.dasha);
const readableBlock = formatPredictionBlock(predictions);
const chartPacket   = buildSuryaChartPacket(chartData);
```

**Don't mix outputs from A and B directly — different data shapes.**
`astro-python-backend/app.py` computes planets/Panchang but **not** Vimshottari
Dasha; only Track A's `calcDasha()` has that. If you want Track B's raw
precision + real dasha, call `calcDasha()` from Track A and feed its output
into Track B's `predictEvents(chartData, dashaFromTrackA)`.

## Accuracy notes

- `chartCalculationEngine.js`: Lahiri ayanamsha, full Meeus series + topocentric
  correction — accurate to ~1 arcmin. Real Vimshottari proportions, real
  Parashari varga rules, real classical yoga definitions (not placeholders).
- `astro-python-backend/app.py` (Swiss Ephemeris/Moshier): more precise still,
  especially near retrograde stations. Requires the `ephe/` data files — keep
  them next to `app.py`.
- `transitPredictionEngine.js` now starts from each transiting planet's REAL
  current position (pass a `currentPlanets` array from a second `calcKundli()`
  call for today's date — see the Track A example above) rather than
  assuming today's sky matches the birth-time sky, which was a real bug in an
  earlier build. It still projects forward using **mean daily motion**
  (constant speed) from that real starting point, which is fine for
  Jupiter/Saturn and looser for Moon/Mercury; for tighter accuracy on exact
  dates, call `chartCalculationEngine.js`'s planet functions at each
  candidate date instead of extrapolating.
- `decisionAdaptiveEngine.js`'s feedback/learning (Phase 9) persists to
  `localStorage` in-browser, in-memory elsewhere — swap in a real DB if you
  need weights to survive reinstalls.

## Left out on purpose

3D solar-system visualization, chart SVG drawing, audio engine, chat UI, all
paid/free LLM provider routing (Cerebras/Gemini/Groq/HuggingFace/Ollama/
OpenRouter/Pollinations), `aiRouter.js`, `server.js`, rate-limiting/auth
middleware, and — as of this build — any AI re-phrasing layer for the Oracle
at all. An app-layer version of that routing existed briefly
(`aiOracleConnector.js`, an optional "Live Oracle" toggle) but has since been
removed so the Oracle is unconditionally offline. None of the above is
calculation logic — build UI and API routing fresh around these engines.
