// oracleContext.js — turns the full computeFullChart() bundle into the
// compact set of REAL facts the Cosmic Oracle narrates around, plus the
// REAL 0-100 scores it displays.
//
// Why this file exists: previously the Oracle card called offlineOracle.js
// with zero arguments and got back one of 4 hardcoded generic paragraphs
// plus fabricated score numbers (see ENGINES-README.md's own "Honest flag"
// section). Nothing here invents a number — every score below is read
// straight from predictions/shadbala/guidance, the exact same objects the
// Probabilities and Guidance screens already render. This module is the
// single place that mapping happens, so the offline reading always narrates
// real numbers, never placeholders.

const JD_EPOCH = 2440587.5;
const nowJD = () => JD_EPOCH + Date.now() / 86400000;

function clamp(v, lo = 0, hi = 100) {
  if (typeof v !== 'number' || Number.isNaN(v)) return Math.round((lo + hi) / 2);
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

/** Shared risk-breakdown math, used by both computeRealScores() (the number)
 *  and buildOracleContext() (the sentence explaining the number) so the two
 *  can never silently drift apart. */
function computeRiskBreakdown(chartData) {
  const { predictions, yogas } = chartData;
  const cancelledCount = Object.values(predictions?.yogaCancellations || {}).filter(Boolean).length;
  const duryogaCount = (yogas || []).filter(y => y.type === 'duryoga').length;
  const strengthVals = Object.values(predictions?.planetStrengths || {});
  const avgStrength = strengthVals.length ? strengthVals.reduce((s, v) => s + v, 0) / strengthVals.length : 50;
  const risk_factor = clamp(30 + cancelledCount * 10 + duryogaCount * 15 - (avgStrength - 50) * 0.4);
  return { cancelledCount, duryogaCount, avgStrength, risk_factor };
}

/** Classical Tithi (lunar day) + Paksha (fortnight) from Sun/Moon sidereal
 *  longitudes already computed by the chart engine — a pure derived readout,
 *  no new position astronomy, just the standard (Moon−Sun)/12° formula. This
 *  Panchanga element wasn't surfaced anywhere in the app before. */
function computeTithiPaksha(sunLon, moonLon) {
  if (typeof sunLon !== 'number' || typeof moonLon !== 'number') return null;
  const angle = ((moonLon - sunLon) % 360 + 360) % 360;
  const tithiNum = Math.min(30, Math.floor(angle / 12) + 1); // 1-30
  const paksha = tithiNum <= 15 ? 'Shukla' : 'Krishna';
  const tithiInPaksha = paksha === 'Shukla' ? tithiNum : tithiNum - 15;
  const TITHI_NAMES = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
    'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
    (paksha === 'Shukla' ? 'Purnima' : 'Amavasya')];
  const name = TITHI_NAMES[tithiInPaksha - 1] || `Tithi ${tithiInPaksha}`;
  return { paksha, tithiInPaksha, name, waxing: paksha === 'Shukla' };
}

/** Real, chart-derived 0-100 scores — no random numbers anywhere in here. */
export function computeRealScores(chartData) {
  const { predictions, shadbala, guidance } = chartData;

  const career_growth = clamp(predictions?.career?.probability);
  const financial_gain = clamp(predictions?.wealth?.probability);
  const relationship_harmony = clamp(predictions?.marriage?.probability);
  const health_stability = clamp(predictions?.health?.probability);
  const spiritual_progress = clamp(predictions?.spirituality?.probability);

  // Mental clarity: Mercury (thought) + Moon (mind) shadbala strength —
  // the two grahas classically tied to buddhi/manas.
  const mercPct = shadbala?.Mercury?.pct ?? 50;
  const moonPct = shadbala?.Moon?.pct ?? 50;
  const mental_clarity = clamp((mercPct + moonPct) / 2);

  const { risk_factor } = computeRiskBreakdown(chartData);

  // Favorable window: nearest upcoming scored dasha×transit window that
  // clears the app's own "favorable" threshold (see decisionAdaptiveEngine.js
  // DECISION_ENGINE.THRESHOLDS.favor = 40) — the exact same bar Guidance uses.
  // ACCURACY FIX: this used to report the window's fixed ±5-day WIDTH (always
  // exactly 10, since TIMELINE_ENGINE builds every window as jd-5..jd+5) —
  // a number that never actually varied chart to chart. It now reports how
  // many days remain until that favorable window actually begins, which is
  // the number someone asking "how long until things turn favorable?" wants.
  const now = nowJD();
  const favorable = (guidance?.windows || [])
    .filter(w => w.score >= 40 && w.end >= now)
    .sort((a, b) => a.start - b.start)[0] || null;
  const nearestTransitDay = chartData.transits?.[0]?.day;
  const favorable_period_days = favorable
    ? Math.max(0, Math.round(favorable.start - now))
    : (typeof nearestTransitDay === 'number' ? Math.max(1, Math.round(nearestTransitDay)) : 45);

  return {
    career_growth, financial_gain, relationship_harmony, health_stability,
    spiritual_progress, mental_clarity, risk_factor, favorable_period_days,
  };
}

/** Real facts to narrate around — every field traces back to an engine output. */
export function buildOracleContext(chartData) {
  const { structured, dashas, yogas, transits, guidance, predictions, shadbala } = chartData;

  const maha = (dashas || []).find(d => d.isCurrent) || dashas?.[0] || null;
  const antar = maha?.bhuktis?.find(b => b.isCurrent) || null;
  const pratyantar = antar?.pratyantar?.find(p => p.isCurrent) || null;

  const lagna = structured.lagna;
  const lagnaLordName = lagna.signLord;
  const lagnaLordPlanet = structured.planets.find(p => p.name === lagnaLordName) || null;
  const lagnaLordDignity = shadbala?.[lagnaLordName]?.dignity || null;
  const lagnaLordHouse = lagnaLordPlanet?.bhavaRashi ?? null;

  const moonPlanet = structured.planets.find(p => p.name === 'Moon') || null;
  const sunPlanet = structured.planets.find(p => p.name === 'Sun') || null;
  const tithi = moonPlanet && sunPlanet
    ? computeTithiPaksha(sunPlanet.sidereal.decimal, moonPlanet.sidereal.decimal)
    : null;

  const allYogas = yogas || [];
  const positiveYogas = allYogas.filter(y => y.type !== 'duryoga');
  const duryogas = allYogas.filter(y => y.type === 'duryoga');
  const sortedYogas = [...positiveYogas].sort((a, b) => (a.strength === 'strong' ? -1 : 1) - (b.strength === 'strong' ? -1 : 1));
  const topYoga = sortedYogas[0] || null;
  const otherYogas = sortedYogas.slice(1);
  const duryoga = duryogas[0] || null;

  const upcomingTransits = (transits || []).slice(0, 3);
  const nearestTransit = upcomingTransits[0] || null;

  const decisions = guidance?.decisions || [];
  const DOMAIN_TO_PRED = { career: 'career', marriage: 'marriage', finance: 'wealth', health: 'health', spirituality: 'spirituality' };
  const PRED_TO_DOMAIN = { career: 'career', marriage: 'marriage', wealth: 'finance', health: 'health', spirituality: 'spirituality' };
  const predEntries = Object.entries(predictions || {})
    .filter(([k]) => ['marriage', 'career', 'wealth', 'health', 'spirituality'].includes(k))
    .map(([k, v]) => ({ domain: k, probability: v.probability, mainHouse: v.mainHouse }));
  const strongest = predEntries.length ? predEntries.reduce((a, b) => (a.probability >= b.probability ? a : b)) : null;
  const weakest = predEntries.length ? predEntries.reduce((a, b) => (a.probability <= b.probability ? a : b)) : null;
  const weakestDecision = decisions.find(d => DOMAIN_TO_PRED[d.domain] === weakest?.domain) || null;
  // All four domain decisions, each now genuinely distinct (see
  // decisionAdaptiveEngine.js's scorePeriodForDomain fix) — keyed by the
  // predictions-side domain name so callers can look them up either way.
  const decisionsByPredDomain = {};
  decisions.forEach(d => { decisionsByPredDomain[DOMAIN_TO_PRED[d.domain]] = d; });

  // Shadbala extremes — which graha is currently strongest/weakest, and by
  // how much, in real Shadbala percentage terms.
  const shadbalaEntries = Object.entries(shadbala || {}).filter(([k]) => k !== '_aspects');
  const strongestPlanet = shadbalaEntries.length
    ? shadbalaEntries.reduce((a, b) => (a[1].pct >= b[1].pct ? a : b))
    : null;
  const weakestPlanet = shadbalaEntries.length
    ? shadbalaEntries.reduce((a, b) => (a[1].pct <= b[1].pct ? a : b))
    : null;

  const riskBreakdown = computeRiskBreakdown(chartData);

  return {
    lagna, lagnaLordName, lagnaLordPlanet, lagnaLordDignity, lagnaLordHouse,
    moonPlanet, tithi,
    maha, antar, pratyantar,
    topYoga, otherYogas, duryoga, duryogaCount: duryogas.length, positiveYogaCount: positiveYogas.length,
    nearestTransit, upcomingTransits,
    strongest, weakest, weakestDecision, predEntries, decisionsByPredDomain, PRED_TO_DOMAIN,
    strongestPlanet: strongestPlanet ? { name: strongestPlanet[0], ...strongestPlanet[1] } : null,
    weakestPlanet: weakestPlanet ? { name: weakestPlanet[0], ...weakestPlanet[1] } : null,
    riskBreakdown,
  };
}

/** Deity/day/remedy mapping used for the closing line — classical, generic, non-prescriptive. */
export const PLANET_DAY = {
  Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
  Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday', Rahu: 'Saturday', Ketu: 'Saturday',
};

export const DOMAIN_PLANET = {
  marriage: 'Venus', career: 'Saturn', wealth: 'Jupiter', health: 'Mars', spirituality: 'Ketu',
};

export const DOMAIN_LABEL = {
  marriage: 'marriage & relationships', career: 'career', wealth: 'finances',
  health: 'health & vitality', spirituality: 'inner/spiritual life',
};
