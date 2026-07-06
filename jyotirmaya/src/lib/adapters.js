// adapters.js — the "thin glue" layer described in the build brief: it wires
// the provided calculation engines together and reshapes their outputs so
// the *next* engine in the pipeline can consume them. No astrology formula
// lives in this file — every number still comes from the engine functions.
import {
  calcKundli, calcDasha, calcShadbala, calcVarga, calcDignity,
} from '../engines/chart-engine/chartCalculationEngine.js';
import { detectYogas } from '../engines/prediction-engine/yogaDetectionEngine.js';
import { buildPredictions } from '../engines/prediction-engine/transitPredictionEngine.js';
import { predictEvents } from '../engines/prediction-engine/probabilityPredictionEngine.js';
import { JYOTISH_ENGINE } from '../engines/prediction-engine/decisionAdaptiveEngine.js';
import { buildSuryaChartPacket } from '../engines/chart-engine/suryaChartPacket.js';

/**
 * Whole-sign Sun house, above/below horizon.
 * The bundled JS chart engine does not expose sunrise/sunset (only the
 * optional Python/Swiss-Ephemeris backend does), so Kala Bala's day/night
 * input is derived from the Sun's own quadrant (Sripati) house — houses
 * 7-12 sit on the Midheaven side of the chart (above the horizon = day),
 * houses 1-6 sit on the IC side (below the horizon = night). This reuses
 * the engine's own house math rather than introducing new astronomy.
 */
export function isDayBirth(structured) {
  const sun = structured.planets.find(p => p.name === 'Sun');
  if (!sun) return true;
  const house = sun.bhavaChalit ?? sun.bhavaRashi;
  return house >= 7 && house <= 12;
}

/** Object.values(calcShadbala()) minus the internal `_aspects` bag, per the engine's documented usage. */
export function shadbalaToArray(shadbala) {
  // ACCURACY FIX: this used to drop the planet name, returning bare value
  // objects. That made it impossible for any downstream consumer to tell
  // *whose* strength a given entry was, so a domain-aware scorer had no way
  // to weight e.g. Venus's strength more heavily for the marriage domain.
  // `name` is added on to each entry (existing `.total`/`.pct` fields are
  // untouched, so nothing that already reads this array breaks).
  return Object.entries(shadbala || {}).filter(([k]) => k !== '_aspects').map(([name, v]) => ({ ...v, name }));
}

/**
 * Current Mahadasha / Antardasha lord names. Includes both `antara` and
 * `antar` keys since probabilityPredictionEngine reads the former (with the
 * latter as its own fallback) while suryaChartPacket reads the latter —
 * populating both means one adapter serves both engines correctly.
 */
export function currentDashaLords(dashas) {
  const maha = (dashas || []).find(d => d.isCurrent) || dashas?.[0] || null;
  if (!maha) return { maha: null, antara: null, antar: null };
  const antarObj = maha.bhuktis?.find(b => b.isCurrent) || null;
  const antarLord = antarObj ? antarObj.lord : null;
  return { maha: maha.lord, antara: antarLord, antar: antarLord };
}

/**
 * Reshapes chartCalculationEngine's `structured.planets` array into the
 * `{ PlanetName: { sign, house, degree, retrograde, speed } }` dictionary
 * that probabilityPredictionEngine.adaptChart() expects (that engine was
 * originally written against the Python backend's dict-shaped response —
 * this makes Track A speak the same shape, using the same field names
 * Track B already returns).
 */
export function structuredToEngineChartData(structured) {
  const planets = {};
  structured.planets.forEach(p => {
    planets[p.name] = {
      sign: p.rashi.name,             // Sanskrit name; probabilityPredictionEngine normalizes it
      house: p.bhavaRashi,            // whole-sign house from Lagna — same convention the Python backend uses
      degree: p.sidereal.decimal,     // full 0-360 sidereal longitude (needed for combustion orb math)
      retrograde: !!p.isRetro,
      speed: p.dailyMotion ?? undefined,
      nakshatra: p.nakshatra,
      pada: p.pada,
    };
  });
  return { planets };
}

/** Same shape as above, plus a `lagna` block — the exact input buildSuryaChartPacket() expects. */
export function structuredToPacketChartData(structured) {
  const base = structuredToEngineChartData(structured);
  return {
    ...base,
    lagna: {
      sign: structured.lagna.rashi,
      degree: structured.lagna.degree, // already 0-30 (degree within sign)
      nakshatra: structured.lagna.nakshatra,
      pada: structured.lagna.pada,
    },
  };
}

/**
 * Computes TODAY's actual planetary positions — by calling the very same
 * accurate calcKundli() used for the natal chart, just for right now instead
 * of the birth moment — and derives from them (a) a planets array shaped for
 * buildPredictions(), and (b) each graha's current whole-sign house counted
 * from the natal Lagna (i.e. real current transiting-planet houses).
 *
 * ERROR FOUND & FIXED: neither transitPredictionEngine.js nor
 * probabilityPredictionEngine.js had any notion of "today's sky" — both
 * silently substituted the chart's own NATAL (birth-moment) planetary
 * positions wherever a "current transit" position was needed. That's only
 * actually correct if today happens to be the birth date; for any other
 * chart the transit dates/houses were off by however many years have
 * elapsed (Jupiter alone drifts ~30°/year). This uses only the engine's own
 * existing, already-accurate calcKundli() — called for a second date — so no
 * new astronomy formula is introduced, matching this file's "reshaping only"
 * contract.
 */
function computeLiveTransitData(lat, lon, natalLagnaRashiIdx) {
  const now = new Date();
  const nowKundli = calcKundli(
    now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours(), now.getUTCMinutes(), lat, lon, 0
  );
  const currentPlanets = nowKundli.structured.planets;
  const liveTransitHouses = {};
  currentPlanets.forEach(p => {
    liveTransitHouses[p.name] = ((p.rashi.idx - natalLagnaRashiIdx + 12) % 12) + 1;
  });
  return { currentPlanets, liveTransitHouses };
}

/**
 * Runs the ENTIRE provided pipeline for one birth profile and returns every
 * piece of data the screens need. This is the only place all six engine
 * files are called together.
 *
 * @param {{year,month,day,hour,minute,lat,lon,tzOffset}} birth
 * @param {string} userId - stable id for this saved profile (adaptive learning + outcome history)
 * @param {object|null} trackBChartData - optional Swiss-Ephemeris response (Track B); when present its
 *        planet positions feed the probability engine while dasha still comes from Track A (per contract).
 */
export function computeFullChart(birth, userId, trackBChartData = null) {
  const { year, month, day, hour, minute, lat, lon, tzOffset } = birth;

  const kundli = calcKundli(year, month, day, hour, minute, lat, lon, tzOffset);
  const structured = kundli.structured;

  const dashas = calcDasha(kundli, `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  const isDay = isDayBirth(structured);
  const shadbala = calcShadbala(kundli, isDay);
  const yogas = detectYogas(structured.planets, structured.lagna.rashiIdx);
  // ERROR FOUND & FIXED: transitPredictionEngine.js's own watchPairs list
  // declares {transit:'Jupiter', natal:'Ascendant'}, but structured.planets
  // (the array we were passing it) only ever contains the 9 grahas — the
  // Ascendant lives separately at structured.lagna. natalPlanetLon() looked
  // it up by name, found nothing, returned null, and that watch pair silently
  // produced zero predictions on every single chart. Adding a synthetic
  // Ascendant point here (same shape the engine expects, same degree the
  // engine already computed) is reshaping-only — no new astrology, per this
  // file's own contract.
  const planetsWithAscendant = [
    ...structured.planets,
    { name: 'Ascendant', sidereal: { decimal: structured.lagna.decimal } },
  ];
  const { currentPlanets, liveTransitHouses } = computeLiveTransitData(lat, lon, structured.lagna.rashiIdx);
  const transits = buildPredictions(planetsWithAscendant, dashas, currentPlanets);

  const dashaForProbability = currentDashaLords(dashas);
  const chartDataForProbability = trackBChartData || structuredToEngineChartData(structured);
  const predictions = predictEvents(chartDataForProbability, dashaForProbability, liveTransitHouses);

  const strengthsArray = shadbalaToArray(shadbala);
  const guidance = JYOTISH_ENGINE.runPipeline(dashas, transits, yogas, strengthsArray, userId);

  return {
    kundli, structured, dashas, isDay, shadbala, yogas, transits,
    predictions, guidance, trackB: !!trackBChartData,
    computedAt: Date.now(),
  };
}

/** Full plain-text natal chart summary (for the "view full text reading" export/share feature). */
export function generateChartSummaryText(structured, dashas) {
  const chartData = structuredToPacketChartData(structured);
  const dashaForPacket = currentDashaLords(dashas);
  return buildSuryaChartPacket(chartData, dashaForPacket);
}

export { calcVarga, calcDignity };
