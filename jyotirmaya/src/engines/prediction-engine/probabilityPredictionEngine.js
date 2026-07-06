// predictionEngine.js — Surya v17
// Planet Strength + Drishti + Varga + Dasha-Transit + Yoga Cancel + Probability

// ── 1. Planet Strength (Shadbala-lite) ───────────────────────
export function planetStrength(p) {
  let s = 50;
  if (p.exalted)     s += 25;
  if (p.own)         s += 15;
  if (p.debilitated) s -= 20;
  if (p.retro)       s += 10;
  if (p.combust)     s -= 15;
  // Kendra bonus
  if ([1,4,7,10].includes(p.house)) s += 10;
  // Trikona bonus
  if ([1,5,9].includes(p.house))    s += 10;
  return Math.max(0, Math.min(100, s));
}

// ── 2. Weighted Aspect (Drishti) ─────────────────────────────
const ASPECT_WEIGHTS = {
  Saturn:25, Jupiter:20, Mars:30,
  Sun:10, Venus:10, Mercury:10, Moon:10, Rahu:8, Ketu:8
};

// Special Vedic aspects offsets (beyond universal 7th)
const SPECIAL_ASPECTS = {
  Mars:   [4,8],
  Jupiter:[5,9],
  Saturn: [3,10],
};

export function getAspects(planetName, houseNum) {
  const out = [((houseNum + 6 - 1) % 12) + 1];
  (SPECIAL_ASPECTS[planetName] || []).forEach(off =>
    out.push(((houseNum + off - 1) % 12) + 1)
  );
  return [...new Set(out)];
}

export function aspectScore(planetName, planetHouse, targetHouse) {
  const aspects = getAspects(planetName, planetHouse);
  if (!aspects.includes(targetHouse)) return 0;
  return ASPECT_WEIGHTS[planetName] || 10;
}

// ── 3. Varga Agreement ───────────────────────────────────────
export function vargaAgree(event, D1planets, D9planets, D10planets) {
  if (event === "marriage") {
    const d1h = D1planets?.Venus?.house;
    const d9h = D9planets?.Venus?.house;
    return d1h != null && d9h != null && d1h === d9h;
  }
  if (event === "career") {
    const d1h  = D1planets?.Sun?.house;
    const d10h = D10planets?.Sun?.house;
    return d1h != null && d10h != null && d1h === d10h;
  }
  return true; // wealth etc — no varga check
}

// ── 4. Dasha–Transit–House Trigger ───────────────────────────
export function triggerScore(planets, dasha, transits, house) {
  let score = 0;
  const maha   = planets[dasha?.maha];
  const antara = planets[dasha?.antara || dasha?.antar];

  if (maha   && maha.house   === house) score += 35;
  if (antara && antara.house === house) score += 35;

  // Aspect bonus for dasha lords on target house
  if (maha) {
    score += aspectScore(dasha.maha, maha.house, house) * 0.5;
  }
  if (antara) {
    const antaraName = dasha.antara || dasha.antar;
    score += aspectScore(antaraName, antara.house, house) * 0.5;
  }

  // Transit planets hitting house
  Object.entries(transits || {}).forEach(([, h]) => {
    if (h === house) score += 30;
  });

  return Math.round(score);
}

// ── 5. Yoga Cancellation ─────────────────────────────────────
export function yogaCancelled(p) {
  if (!p) return false;
  if (p.combust && p.retrograde) return true;
  if ([6,8,12].includes(p.house)) return true;
  return false;
}

// ── 6. Event Probability ─────────────────────────────────────
export function eventProbability(planets, dasha, transits, eventHouse, mainPlanetName) {
  const p = planets[mainPlanetName];
  if (!p) return 0;

  const strength  = planetStrength({
    exalted: p.exalted || p.signStatus === "Exalted",
    own:     p.own     || p.signStatus === "Own Sign",
    debilitated: p.debilitated || p.signStatus === "Debilitated",
    retro:   p.retrograde,
    combust: p.combust,
    house:   p.house,
  });

  const trigger   = triggerScore(planets, dasha, transits, eventHouse);
  const cancelled = yogaCancelled(p) ? -30 : 0;

  // Aspect bonus: other strong planets aspecting event house
  let aspectBonus = 0;
  ["Jupiter","Venus","Mars","Saturn","Sun","Moon","Mercury"].forEach(pn => {
    if (pn === mainPlanetName) return;
    const ap = planets[pn];
    if (!ap) return;
    const sc = aspectScore(pn, ap.house, eventHouse);
    // Benefic aspects add, malefic can add or subtract
    if (["Jupiter","Venus","Mercury"].includes(pn)) aspectBonus += sc * 0.3;
    else aspectBonus += sc * 0.1;
  });

  const total = strength + trigger + cancelled + aspectBonus;
  return Math.max(0, Math.min(100, Math.round(total)));
}

// ── 7. House Activation Timeline ────────────────────────────
export function houseTimeline(jupiterHouse, years = 7) {
  const timeline = [];
  for (let y = 0; y < years; y++) {
    const house = ((jupiterHouse - 1 + y) % 12) + 1;
    timeline.push({ yearOffset: y, activeHouse: house });
  }
  return timeline;
}

// BUG FIX: Frontend sends Sanskrit sign names; normalize to English.
const _SANSK_EN = {
  Mesha:"Aries", Vrishabha:"Taurus", Mithuna:"Gemini", Karka:"Cancer",
  Simha:"Leo", Kanya:"Virgo", Tula:"Libra",
  Vrishchika:"Scorpio", Vrischika:"Scorpio",
  Dhanu:"Sagittarius", Dhanus:"Sagittarius",
  Makara:"Capricorn", Kumbha:"Aquarius", Meena:"Pisces"
};
function _normSign(s) { return _SANSK_EN[s] || s; }

// ── 8. Build chart adapter from pyswisseph output ───────────
// Converts raw chartData from /calculate into engine-ready form
export function adaptChart(chartData, dashaData, liveTransitHouses) {
  const planets = {};
  const raw = chartData.planets || {};

  const EXALTATION   = { Sun:"Aries",Moon:"Taurus",Mars:"Capricorn",Mercury:"Virgo",Jupiter:"Cancer",Venus:"Pisces",Saturn:"Libra",Rahu:"Taurus",Ketu:"Scorpio" };
  const DEBILITATION = { Sun:"Libra",Moon:"Scorpio",Mars:"Cancer",Mercury:"Pisces",Jupiter:"Capricorn",Venus:"Virgo",Saturn:"Aries",Rahu:"Scorpio",Ketu:"Taurus" };
  const OWN_SIGNS    = { Mars:["Aries","Scorpio"],Venus:["Taurus","Libra"],Mercury:["Gemini","Virgo"],Moon:["Cancer"],Sun:["Leo"],Jupiter:["Sagittarius","Pisces"],Saturn:["Capricorn","Aquarius"],Rahu:[],Ketu:[] };
  const COMBUSTION_ORBS = { Moon:12,Mars:17,Mercury:14,Jupiter:11,Venus:10,Saturn:15 };

  const sunDeg = raw.Sun?.degree ?? 0;

  for (const [name, p] of Object.entries(raw)) {
    const sign = _normSign(p.sign || p.rashi || "");
    // Combustion
    let combust = false;
    if (name !== "Sun" && name !== "Rahu" && name !== "Ketu") {
      const orb = COMBUSTION_ORBS[name] || 0;
      let diff = Math.abs((p.degree ?? 0) - sunDeg);
      if (diff > 180) diff = 360 - diff;
      combust = diff <= orb;
    }
    planets[name] = {
      sign,
      house:     p.house || 1,
      degree:    p.degree ?? 0,
      retrograde:p.retrograde || p.speed < 0,
      combust,
      exalted:   EXALTATION[name]   === sign,
      own:       (OWN_SIGNS[name]   || []).includes(sign),
      debilitated: DEBILITATION[name] === sign,
    };
  }

  const dasha = dashaData || chartData.dasha || null;

  // ACCURACY FIX: this used to build "transits" purely from this chart's own
  // (natal) planet houses — the comment even said so ("we use the chart's
  // own planet positions as transits approximation"). That's only actually
  // correct if today happens to be the birth date; for anyone else it silently
  // reused birth-time placements as if they were today's sky. `liveTransitHouses`
  // — today's real transiting-planet houses counted from natal Lagna, computed
  // by the caller from an actual "now" chart — is used when supplied; the old
  // natal-position approximation remains only as a fallback.
  const transits = (liveTransitHouses && Object.keys(liveTransitHouses).length)
    ? liveTransitHouses
    : (() => {
        const t = {};
        ["Jupiter","Saturn","Mars"].forEach(pn => { if (planets[pn]) t[pn] = planets[pn].house; });
        return t;
      })();

  return { planets, dasha, transits };
}

// ── 9. Master Predict ─────────────────────────────────────────
export function predictEvents(chartData, dashaData, liveTransitHouses) {
  const { planets, dasha, transits } = adaptChart(chartData, dashaData, liveTransitHouses);
  const jupHouse = planets.Jupiter?.house || 1;

  const result = {
    marriage: {
      probability: eventProbability(planets, dasha, transits, 7, "Venus"),
      varga: false, // D9/D10 not available from single chart
      mainHouse: 7,
    },
    career: {
      probability: eventProbability(planets, dasha, transits, 10, "Sun"),
      varga: false,
      mainHouse: 10,
    },
    wealth: {
      probability: eventProbability(planets, dasha, transits, 2, "Jupiter"),
      varga: true,
      mainHouse: 2,
    },
    health: {
      probability: eventProbability(planets, dasha, transits, 6, "Mars"),
      varga: true,
      mainHouse: 6,
    },
    spirituality: {
      probability: eventProbability(planets, dasha, transits, 12, "Ketu"),
      varga: true,
      mainHouse: 12,
    },
    timeline: houseTimeline(jupHouse, 7),
    planetStrengths: {},
    dashaTrigger: {},
    yogaCancellations: {},
  };

  // Planet strengths
  for (const [name, p] of Object.entries(planets)) {
    result.planetStrengths[name] = planetStrength({
      exalted: p.exalted,
      own:     p.own,
      debilitated: p.debilitated,
      retro:   p.retrograde,
      combust: p.combust,
      house:   p.house,
    });
  }

  // Dasha trigger scores per house
  for (let h = 1; h <= 12; h++) {
    result.dashaTrigger[h] = triggerScore(planets, dasha, transits, h);
  }

  // Yoga cancellations
  for (const [name, p] of Object.entries(planets)) {
    result.yogaCancellations[name] = yogaCancelled(p);
  }

  return result;
}

// ── 10. Format prediction for Oracle prompt injection ────────
export function formatPredictionBlock(pred) {
  if (!pred) return "";

  const events = ["marriage","career","wealth","health","spirituality"];
  let lines = "\n--- SURYA_PREDICTION_ENGINE ---\n";

  lines += "\nEVENT PROBABILITIES:\n";
  events.forEach(ev => {
    const e = pred[ev];
    lines += `${ev.toUpperCase()}: ${e.probability}% (House ${e.mainHouse})\n`;
  });

  lines += "\nPLANET STRENGTHS (0-100):\n";
  Object.entries(pred.planetStrengths).forEach(([n, s]) => {
    lines += `${n}: ${s}\n`;
  });

  lines += "\nYOGA CANCELLATIONS:\n";
  const cancelled = Object.entries(pred.yogaCancellations)
    .filter(([,v]) => v).map(([n]) => n);
  lines += cancelled.length ? cancelled.join(", ") + "\n" : "None\n";

  lines += "\nHOUSE ACTIVATION TIMELINE (Jupiter transit):\n";
  pred.timeline.slice(0,5).forEach(t => {
    lines += `Year +${t.yearOffset}: House ${t.activeHouse}\n`;
  });

  lines += "--- END PREDICTION ENGINE ---\n";
  return lines;
}
