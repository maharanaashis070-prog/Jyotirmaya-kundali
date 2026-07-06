// suryaChartPacket.js — Surya Jyotish v11
// Converts pyswisseph chart data → SURYA_CHART_PACKET for AI Oracle

const SIGNS = [
  "Aries","Taurus","Gemini","Cancer","Leo","Virgo",
  "Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"
];

const SIGN_LORDS = {
  Aries:"Mars", Taurus:"Venus", Gemini:"Mercury", Cancer:"Moon",
  Leo:"Sun", Virgo:"Mercury", Libra:"Venus", Scorpio:"Mars",
  Sagittarius:"Jupiter", Capricorn:"Saturn", Aquarius:"Saturn", Pisces:"Jupiter"
};

const EXALTATION = {
  Sun:"Aries", Moon:"Taurus", Mars:"Capricorn", Mercury:"Virgo",
  Jupiter:"Cancer", Venus:"Pisces", Saturn:"Libra",
  Rahu:"Taurus", Ketu:"Scorpio"
};

const DEBILITATION = {
  Sun:"Libra", Moon:"Scorpio", Mars:"Cancer", Mercury:"Pisces",
  Jupiter:"Capricorn", Venus:"Virgo", Saturn:"Aries",
  Rahu:"Scorpio", Ketu:"Taurus"
};

const OWN_SIGNS = {
  Mars:["Aries","Scorpio"], Venus:["Taurus","Libra"], Mercury:["Gemini","Virgo"],
  Moon:["Cancer"], Sun:["Leo"], Jupiter:["Sagittarius","Pisces"],
  Saturn:["Capricorn","Aquarius"], Rahu:[], Ketu:[]
};

// BUG FIX: Frontend sends Sanskrit names; server code uses English. Normalize.
const SANSKRIT_TO_ENGLISH = {
  Mesha:"Aries", Vrishabha:"Taurus", Mithuna:"Gemini", Karka:"Cancer",
  Simha:"Leo", Kanya:"Virgo", Tula:"Libra",
  Vrishchika:"Scorpio", Vrischika:"Scorpio",
  Dhanu:"Sagittarius", Dhanus:"Sagittarius",
  Makara:"Capricorn", Kumbha:"Aquarius", Meena:"Pisces"
};

function normSign(s) {
  return SANSKRIT_TO_ENGLISH[s] || s;
}

// Vedic combustion orbs (degrees from Sun)
const COMBUSTION_ORBS = {
  Moon:12, Mars:17, Mercury:14, Jupiter:11, Venus:10, Saturn:15,
  Rahu:0, Ketu:0
};

// Vedic special aspects (beyond universal 7th)
const SPECIAL_ASPECTS = {
  Mars:   [4, 8],   // 4th and 8th from its position
  Jupiter:[5, 9],   // 5th and 9th
  Saturn: [3, 10],  // 3rd and 10th
};

function getSignStatus(planetName, signName) {
  const s = normSign(signName);
  const statuses = [];
  if (EXALTATION[planetName]  === s) statuses.push("Exalted");
  if (DEBILITATION[planetName] === s) statuses.push("Debilitated");
  if (OWN_SIGNS[planetName]?.includes(s)) statuses.push("Own Sign");
  return statuses.join(" | ");
}

function isCombust(planetName, planetDeg, sunDeg) {
  const orb = COMBUSTION_ORBS[planetName];
  if (!orb) return false;
  let diff = Math.abs(planetDeg - sunDeg);
  if (diff > 180) diff = 360 - diff;
  return diff <= orb;
}

function getAspectedHouses(planetName, houseNum) {
  const aspects = [];
  // Universal 7th aspect (all planets)
  aspects.push(((houseNum + 6 - 1) % 12) + 1);
  // Special aspects
  if (SPECIAL_ASPECTS[planetName]) {
    for (const offset of SPECIAL_ASPECTS[planetName]) {
      aspects.push(((houseNum + offset - 1) % 12) + 1);
    }
  }
  return [...new Set(aspects)].sort((a, b) => a - b);
}

function buildSuryaChartPacket(chartData, dashaData) {
  // chartData shape: what /calculate returns from Python
  // OR kundaliData.structured from frontend
  // We handle both by normalizing

  const planets = chartData.planets || {};
  const lagna   = chartData.lagna || chartData.ascendant;
  const dasha    = dashaData || chartData.dasha || null;
  const panchang = chartData.panchang || null;

  // Lagna
  let lagnaLine = "Unknown";
  if (lagna) {
    const lagnaSign = lagna.sign || lagna.rashi || "Unknown";
    const lagnaDeg  = (lagna.degreeInSign ?? lagna.degree ?? 0).toFixed(2);
    const lagnaNak  = lagna.nakshatra || "";
    const lagnaPada = (lagna.nakshatra_data?.pada) || lagna.pada || "";
    lagnaLine = `${lagnaSign} ${lagnaDeg}° | Nakshatra: ${lagnaNak} Pada ${lagnaPada}`;
  }

  // Lagna sign index for lordship calculation
  const lagnaSignName = normSign(lagna?.sign || lagna?.rashi || "");
  const lagnaSignIdx  = SIGNS.indexOf(lagnaSignName);

  // Sun degree for combustion check
  const sunPlanet = planets["Sun"] || {};
  // Get full sidereal degree for Sun (0-360)
  const sunFullDeg = sunPlanet.degree ?? 0;

  // ── PLANETS BLOCK ──────────────────────────────────────────────────
  const PLANET_ORDER = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"];
  let planetLines = "";

  for (const pName of PLANET_ORDER) {
    const p = planets[pName];
    if (!p) continue;

    const sign     = normSign(p.sign || p.rashi || "?");
    const degInSign = typeof p.degreeInSign === "number" ? p.degreeInSign.toFixed(2)
                    : (typeof p.degree === "number" && p.degree < 30 ? p.degree.toFixed(2)
                    : (p.degree % 30).toFixed(2));

    const house    = p.house || p.bhavaRashi || "?";
    const nak      = p.nakshatra || (p.nakshatra_data?.name) || "?";
    const pada     = (p.nakshatra_data?.pada) || p.pada || "?";
    const retro    = p.retrograde ? "Retrograde" : "Direct";

    // Combustion check (skip Sun itself, skip Rahu/Ketu)
    let combustStr = "";
    if (pName !== "Sun" && pName !== "Rahu" && pName !== "Ketu") {
      // Use full sidereal degree if available
      const pFullDeg = typeof p.degree === "number" ? p.degree : 0;
      const combust  = isCombust(pName, pFullDeg, sunFullDeg);
      if (combust) combustStr = " | Combust";
    }

    // Sign status (exalted/debilitated/own)
    const status = getSignStatus(pName, sign);
    const statusStr = status ? ` | ${status}` : "";

    planetLines += `${pName}: ${sign} ${degInSign}° | ${house}th Bhava | `
      + `${nak} Pada ${pada} | ${retro}${combustStr}${statusStr}\n`;
  }

  // ── HOUSE LORDSHIPS ──────────────────────────────────────────────
  let lordshipLines = "";
  if (lagnaSignIdx >= 0) {
    for (let i = 1; i <= 12; i++) {
      const signIdx = (lagnaSignIdx + i - 1) % 12;
      const signName = SIGNS[signIdx];
      const lord     = SIGN_LORDS[signName];
      // Find where this lord is placed
      const lordPlanet = planets[lord];
      const lordHouse  = lordPlanet?.house || lordPlanet?.bhavaRashi || "?";
      lordshipLines += `${i}L ${lord} → ${i === lordHouse ? "own house" : `${lordHouse}th`}\n`;
    }
  } else {
    lordshipLines = "(Lagna sign not available)\n";
  }

  // ── ASPECTS ──────────────────────────────────────────────────────
  let aspectLines = "";
  for (const pName of PLANET_ORDER) {
    const p = planets[pName];
    if (!p) continue;
    const house = p.house || p.bhavaRashi;
    if (!house || house === "?") continue;
    const aspHouses = getAspectedHouses(pName, house);
    aspectLines += `${pName} (${house}th) aspects: ${aspHouses.join(", ")}\n`;
  }

  // ── DASHA ────────────────────────────────────────────────────────
  let dashaLines = "(Dasha not provided)\n";
  if (dasha) {
    dashaLines = `Mahadasha: ${dasha.maha || dasha.lord || "?"}\n`;
    if (dasha.antar || dasha.antarLord) {
      dashaLines += `Antardasha: ${dasha.antar || dasha.antarLord}\n`;
    }
    if (dasha.remainingDays != null) {
      dashaLines += `Days remaining in Antardasha: ${dasha.remainingDays}\n`;
    }
  }

  // ── PANCHANG ────────────────────────────────────────────────────
  let panchangLines = "";
  if (panchang) {
    panchangLines = `\nPANCHANG:\nTithi: ${panchang.tithi || "?"} | Nakshatra: ${panchang.nakshatra || "?"} | Vara: ${panchang.vara || "?"}\nYoga: ${panchang.yoga || "?"} | Karana: ${panchang.karana || "?"}\n`;
  }

  // ── ASSEMBLE ────────────────────────────────────────────────────
  const packet =
`--- SURYA_CHART_PACKET ---

Lagna: ${lagnaLine}

PLANETS:
${planetLines.trim()}

HOUSE LORDSHIPS:
${lordshipLines.trim()}

ASPECTS (Vedic Drishti):
${aspectLines.trim()}

DASHA:
${dashaLines.trim()}${panchangLines}
--- END PACKET ---

ORACLE RULE: Base 100% of interpretation on the SURYA_CHART_PACKET above.
Do not generalize beyond this data. Reason from nakshatra, pada, lordships,
aspects, retrograde, combustion, and dasha as a trained Vedic astrologer.`;

  return packet;
}

export { buildSuryaChartPacket };
