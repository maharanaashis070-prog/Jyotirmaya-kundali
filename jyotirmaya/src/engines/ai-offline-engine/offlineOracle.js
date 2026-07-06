// offlineOracle.js — Cosmic Memory Engine (no network, always works, 100% free)
//
// This Oracle is fully offline by design: every sentence it produces is
// composed right here, on-device, from this profile's OWN computed
// dasha/yoga/transit/probability/shadbala data (via oracleContext.js), and
// reports the exact same scores the Probabilities and Guidance screens show.
// Nothing here is fabricated, and nothing here ever leaves the browser —
// there is no network call anywhere in this file or in oracleContext.js.
// The only thing that varies between "Draw another" clicks is which of a
// few equally-accurate PHRASINGS is used, never which facts are told.
//
// This reading is intentionally long-form: it walks the whole chart in
// order — ruling dasha, mind/Moon, classical yogas, upcoming transits, all
// five tracked life domains, planetary strength, a risk composite, and
// focused guidance for the domain needing the most attention — rather than
// a short summary, so every number on the Probabilities/Guidance/Yogas
// screens is also explained in plain language, in one continuous reading.

import { buildOracleContext, computeRealScores, PLANET_DAY, DOMAIN_PLANET, DOMAIN_LABEL } from './oracleContext.js';

const DIGNITY_PHRASE = {
  'Exalted': 'exalted — operating at its classical peak',
  'Own House': 'in its own sign — settled, self-assured',
  'Debilitated': 'debilitated — its natural strength has to be worked for, not assumed',
  'Neutral': 'in a neutral sign — its strength depends on the houses it commands',
};

function pick(variant, arr) { return arr[((variant % arr.length) + arr.length) % arr.length]; }
function cap(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }
function article(word) { return /^[aeiou]/i.test(word || '') ? 'an' : 'a'; }

// ── 1. Ruling dasha + Lagna ──────────────────────────────────────────────
function openingParagraph(ctx, variant) {
  const { maha, antar, pratyantar, lagna, lagnaLordName, lagnaLordPlanet, lagnaLordDignity } = ctx;
  if (!maha) return '';
  const pctStr = typeof maha.pct === 'number' ? `${maha.pct.toFixed(1)}%` : null;
  const remStr = maha.rem ? `${maha.rem} years remain in it` : null;
  const antarStr = antar ? `, within its ${antar.lord} Antardasha` : '';
  const pratyantarStr = pratyantar ? `, currently refined further by a ${pratyantar.lord} Pratyantardasha` : '';
  const dignityPhrase = lagnaLordDignity ? DIGNITY_PHRASE[lagnaLordDignity] : null;
  const openers = [
    `You are currently living through the ${maha.lord} Mahadasha${antarStr}${pratyantarStr}`,
    `The ruling period of your chart right now is ${maha.lord}'s Mahadasha${antarStr}${pratyantarStr}`,
    `${maha.lord} holds the reins of your life's current chapter${antarStr}${pratyantarStr}`,
  ];
  const lagnaBits = lagnaLordPlanet
    ? [
      ` Your ascendant is ${lagna.rashi} (${lagna.nakshatra} nakshatra, pada ${lagna.pada}), commanded by ${lagnaLordName}, who sits in your ${lagnaLordPlanet.bhavaRashi}th house${dignityPhrase ? ` and is ${dignityPhrase}` : ''}.`,
      ` ${lagna.rashi} rises in your chart (${lagna.nakshatra}, pada ${lagna.pada}), and its lord ${lagnaLordName} is placed in house ${lagnaLordPlanet.bhavaRashi}${dignityPhrase ? `, ${dignityPhrase}` : ''} — that house's affairs colour everything this dasha touches.`,
      ` With ${lagna.rashi} as your ascendant (${lagna.nakshatra} nakshatra, pada ${lagna.pada}), ${lagnaLordName} governs house ${lagnaLordPlanet.bhavaRashi}${dignityPhrase ? ` while ${dignityPhrase}` : ''}, setting the tone for this cycle.`,
    ]
    : [];
  const pctBits = pctStr ? [
    ` You're ${pctStr} through this Mahadasha${remStr ? ` — roughly ${remStr}` : ''} —`,
    ` This cycle is ${pctStr} elapsed${remStr ? ` (${remStr})` : ''}, meaning`,
    ` At ${pctStr} through the period${remStr ? `, with ${remStr}` : ''},`,
  ] : [''];
  const opener = pick(variant, openers);
  const lagnaBit = pick(variant, lagnaBits.length ? lagnaBits : ['']);
  const pctBit = pick(variant, pctBits);
  const tailBits = [
    'foundations laid now outlast the period itself.',
    'the effects compound rather than land all at once.',
    'patience with the process matters more than urgency about the outcome.',
  ];
  return `${opener}.${lagnaBit}${pctBit} ${pick(variant, tailBits)}`;
}

// ── 2. Moon, mind, and the lunar day (Tithi/Paksha) ───────────────────────
function moonMindParagraph(ctx, variant) {
  const { moonPlanet, tithi } = ctx;
  if (!moonPlanet) return '';
  const house = moonPlanet.bhavaRashi;
  const tithiBit = tithi
    ? ` You were born on a ${tithi.waxing ? 'waxing (Shukla Paksha)' : 'waning (Krishna Paksha)'} lunar day — the ${tithi.name} tithi — classically read as a ${tithi.waxing ? 'building, accumulating' : 'releasing, consolidating'} kind of energy.`
    : '';
  const lines = [
    `Your Moon — the classical seat of the mind — sits in ${moonPlanet.rashi.name} in your ${house}th house, within ${moonPlanet.nakshatra} nakshatra (pada ${moonPlanet.pada}, ruled by ${moonPlanet.nakshatraLord}).${tithiBit} This placement shapes how you instinctively process emotion and react to change, running underneath the dasha above.`,
    `The mind's own planet, the Moon, is placed in ${moonPlanet.rashi.name} (house ${house}), anchored in ${moonPlanet.nakshatra} nakshatra under ${moonPlanet.nakshatraLord}'s rulership, pada ${moonPlanet.pada}.${tithiBit} That nakshatra's temperament colours every other reading here.`,
  ];
  return pick(variant, lines);
}

// ── 3. Every classical yoga detected, not just the headline one ──────────
function yogasParagraph(ctx, variant) {
  const { topYoga, otherYogas, duryoga, duryogaCount, positiveYogaCount } = ctx;
  if (!topYoga && !duryoga) {
    return pick(variant, [
      'No major classical Raja or Dhana yoga is flagged in this chart — that is an ordinary, ungilded chart, not a deficient one; steady effort carries more weight here than a dramatic combination would.',
      'This chart does not currently show a headline planetary yoga — nothing dramatic to lean on, but also nothing to blame; consistency is the more reliable lever.',
    ]);
  }
  const parts = [];
  if (topYoga) {
    parts.push(pick(variant, [
      `${topYoga.name} is active in your chart: ${topYoga.desc}`,
      `Worth naming directly — ${topYoga.name} is present. ${topYoga.desc}`,
    ]));
  }
  if (otherYogas && otherYogas.length) {
    const names = otherYogas.map(y => y.name).join(', ');
    parts.push(pick(variant, [
      `In total, ${positiveYogaCount} classical combination${positiveYogaCount === 1 ? '' : 's'} ${positiveYogaCount === 1 ? 'is' : 'are'} present in this chart; beyond the one above, it also carries ${names} — each adding its own, smaller, thread of support.`,
      `Layered alongside it: ${names}. Together with the yoga named above, that's ${positiveYogaCount} distinct classical combinations working in this chart.`,
    ]));
  }
  if (duryoga) {
    parts.push(pick(variant, [
      `Alongside the supportive combinations, ${duryoga.name} is also present: ${duryoga.desc} This is a real factor, not a life sentence — its classical remedy is simply consistent effort in the area it touches.`,
      `${duryoga.name} also shows up (${duryoga.desc}) — worth knowing about, not worth dreading.`,
    ]));
    if (duryogaCount > 1) {
      parts.push(`(${duryogaCount} challenging combinations were detected in total; only the clearest is named above — the Yogas page lists every one individually.)`);
    }
  }
  return parts.join(' ');
}

// ── 4. Upcoming transits — nearest plus the two after it ──────────────────
function transitForecastParagraph(ctx, variant) {
  const { upcomingTransits } = ctx;
  if (!upcomingTransits || !upcomingTransits.length) {
    return pick(variant, [
      'No major Jupiter, Saturn, Mars, or Venus transit to your key natal points falls inside the current scan window — a quiet stretch on the transit front specifically.',
      'The transit scan for the next two years shows nothing dramatic hitting your natal chart right now — nothing to brace for on that front.',
    ]);
  }
  const [first, ...rest] = upcomingTransits;
  const days = Math.round(first.day);
  const opener = pick(variant, [
    `On the transit front: ${first.transitPlanet} is heading toward an exact ${first.aspectName} to your natal ${first.natalPlanet}, around ${first.dateStr} (about ${days} days out). ${first.meaning}`,
    `Coming up — ${first.transitPlanet}'s ${first.aspectName} to your natal ${first.natalPlanet} exacts near ${first.dateStr}, roughly ${days} days from now. ${first.meaning}`,
  ]);
  if (!rest.length) return opener;
  const restBits = rest.map(t => `${t.transitPlanet} ${t.aspectName.toLowerCase()} natal ${t.natalPlanet} around ${t.dateStr}`).join(', then ');
  const tail = pick(variant, [
    ` Further out, the same scan also flags: ${restBits} — worth marking on a calendar, though the window above is the nearer and generally stronger of the set.`,
    ` After that, watch for ${restBits} as the next two contact points in this same two-year scan.`,
  ]);
  return opener + tail;
}

// ── 5. All five tracked life domains, not just the top and bottom one ────
function domainsParagraph(ctx, variant) {
  const { predEntries, strongest, weakest } = ctx;
  if (!predEntries || !predEntries.length) return '';
  const sorted = [...predEntries].sort((a, b) => b.probability - a.probability);
  const listBits = sorted.map(e => `${DOMAIN_LABEL[e.domain]} ${e.probability}%`).join(', ');
  const opener = pick(variant, [
    `Across all five life areas this app tracks, the computed likelihoods currently read: ${listBits}.`,
    `Here is the full spread this chart currently computes across every tracked area: ${listBits}.`,
  ]);
  const strongLine = strongest ? pick(variant, [
    ` ${cap(DOMAIN_LABEL[strongest.domain])} leads, anchored in house ${strongest.mainHouse}.`,
    ` The strongest reading sits with ${DOMAIN_LABEL[strongest.domain]}, tied to house ${strongest.mainHouse}.`,
  ]) : '';
  const weakLine = (weakest && strongest && weakest.domain !== strongest.domain) ? pick(variant, [
    ` ${cap(DOMAIN_LABEL[weakest.domain])} trails at the other end (house ${weakest.mainHouse}) — not a warning, simply where less planetary support is currently gathered.`,
    ` At the quieter end sits ${DOMAIN_LABEL[weakest.domain]} (house ${weakest.mainHouse}) — worth knowing, not worth worrying over.`,
  ]) : '';
  return opener + strongLine + weakLine;
}

// ── 6. Planetary strength (Shadbala) extremes ─────────────────────────────
function strengthParagraph(ctx, variant) {
  const { strongestPlanet, weakestPlanet } = ctx;
  if (!strongestPlanet || !weakestPlanet) return '';
  const sameOne = strongestPlanet.name === weakestPlanet.name;
  const strongDignityWord = (strongestPlanet.dignity || 'neutral').toLowerCase();
  const strongDignityBit = strongestPlanet.dignity === 'Exalted' ? ' and it is exalted besides' : ` holding ${article(strongDignityWord)} ${strongDignityWord} dignity`;
  const lines = [
    `In terms of raw planetary strength (Shadbala), ${strongestPlanet.name} is your best-resourced graha at ${strongestPlanet.pct}%${strongDignityBit}.${sameOne ? '' : ` ${weakestPlanet.name} sits at the other end, ${weakestPlanet.pct}% — its significations may need more conscious attention than the chart hands you for free.`}`,
    `Shadbala-wise, ${strongestPlanet.name} carries the most weight in this chart (${strongestPlanet.pct}%)${strongestPlanet.dignity === 'Exalted' ? ', exalted at that' : ''}.${sameOne ? '' : ` By comparison, ${weakestPlanet.name} is weakest (${weakestPlanet.pct}%) — a graha whose house and significations benefit from deliberate strengthening.`}`,
  ];
  return pick(variant, lines);
}

// ── 7. Risk composite, explained rather than just shown as a number ──────
function riskParagraph(ctx, scores, variant) {
  const { riskBreakdown } = ctx;
  if (!riskBreakdown) return '';
  const { cancelledCount, duryogaCount } = riskBreakdown;
  const level = scores.risk_factor >= 60 ? 'elevated' : scores.risk_factor >= 35 ? 'moderate' : 'low';
  const contributors = [];
  if (duryogaCount) contributors.push(`${duryogaCount} challenging yoga${duryogaCount > 1 ? 's' : ''}`);
  if (cancelledCount) contributors.push(`${cancelledCount} yoga cancellation${cancelledCount > 1 ? 's' : ''} (a benefic placement undone by combustion or a dusthana house)`);
  const contribStr = contributors.length ? `, driven mainly by ${contributors.join(' and ')}` : ', with no major cancellations or challenging yogas pulling it up';
  const lines = [
    `Putting the cautionary side together, this chart's overall risk composite reads ${scores.risk_factor}/100 (${level})${contribStr}.`,
    `The composite risk reading here is ${scores.risk_factor} out of 100 — ${level}${contribStr}.`,
  ];
  return pick(variant, lines);
}

// ── 8. Focused guidance for the domain needing the most attention ────────
function guidanceParagraph(ctx, scores, variant) {
  const { weakest, weakestDecision } = ctx;
  if (!weakest || !weakestDecision) return '';
  const timingBit = typeof scores.favorable_period_days === 'number'
    ? ` The nearest period that clears this chart's own "favorable" bar is roughly ${scores.favorable_period_days} day${scores.favorable_period_days === 1 ? '' : 's'} away.`
    : '';
  const lines = [
    `For ${DOMAIN_LABEL[weakest.domain]} specifically — the area currently carrying the least planetary support — the chart's own decision engine reads this period as "${weakestDecision.level}" and advises: ${weakestDecision.advice}${timingBit}`,
    `Focused guidance for ${DOMAIN_LABEL[weakest.domain]}: the decision engine scores this period here as "${weakestDecision.level}", with the advice: ${weakestDecision.advice}${timingBit}`,
  ];
  return pick(variant, lines);
}

// ── 9. Classical remedy + closing reflection ──────────────────────────────
function closingParagraph(ctx, variant) {
  const { weakest } = ctx;
  const planet = weakest ? DOMAIN_PLANET[weakest.domain] : 'Jupiter';
  const day = PLANET_DAY[planet] || 'Thursday';
  const lines = [
    `A simple, classical practice tied to this: ${planet}'s day is ${day} — a small, consistent act of discipline or devotion on that day (a lamp lit, water offered, a few quiet minutes) is the traditional way this house is nudged, gently, over weeks rather than instantly.`,
    `Traditionally, this is the kind of period where a small ${day} ritual honouring ${planet} — nothing elaborate — is offered as a steady, low-cost way to support the area under the most pressure.`,
  ];
  return pick(variant, lines);
}

/**
 * Composes a long-form reading entirely from this chart's own computed data,
 * walking the ruling dasha, Moon/mind, every classical yoga, the next three
 * upcoming transits, all five tracked life domains, planetary strength, a
 * risk composite, and focused guidance for the weakest domain — nine
 * sections in total. Fully offline: no fetch, no key, no rate limit, works
 * forever, and nothing here ever leaves the browser.
 * @param {object} chartData - the full computeFullChart() bundle
 * @param {number} variant - rotates phrasing only, never the underlying facts
 */
export async function offlineOracleGenerate(chartData, variant = 0) {
  const ctx = buildOracleContext(chartData);
  const scores = computeRealScores(chartData);
  const narrative = [
    openingParagraph(ctx, variant),
    moonMindParagraph(ctx, variant + 1),
    yogasParagraph(ctx, variant + 1),
    transitForecastParagraph(ctx, variant + 2),
    domainsParagraph(ctx, variant),
    strengthParagraph(ctx, variant + 2),
    riskParagraph(ctx, scores, variant + 1),
    guidanceParagraph(ctx, scores, variant),
    closingParagraph(ctx, variant + 1),
  ].filter(Boolean).join('\n\n');

  return { narrative, scores, source: 'offline', ctx };
}
