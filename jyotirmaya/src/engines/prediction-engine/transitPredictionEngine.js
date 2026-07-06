// ═══════════════════════════════════════════════════════════════════════
// transitPredictionEngine.js — Transit-based Event Prediction
// Extracted & cleaned from surya-ai-brain-10-1-1.html
//
// Scans upcoming transiting-planet-to-natal-planet aspects (conjunction,
// sextile, square, trine, opposition) over the next ~2 years using mean
// daily motions, and produces dated, dasha-aware, human-readable predictions
// for Jupiter/Saturn/Mars/Venus activating key natal points.
//
// NOTE: uses mean (average) daily motion, not true anomaly — good for
// ±1-2 day windows on slow movers (Jupiter/Saturn), looser for fast movers.
// For higher precision, replace futurePosition()/findSignIngresses() with
// repeated calls into chartCalculationEngine.js's planet longitude functions.
//
// INPUT CONTRACT: `natalPlanets` = kundli.structured.planets (array, from
// chartCalculationEngine.js). `dashas` = output of calcDasha(). `currentPlanets`
// (optional but strongly recommended) = the *same* kind of array, computed by
// calling calcKundli() for TODAY's date instead of the birth date — this is
// what "today's actual planetary positions" means, and is required for the
// transit dates below to be astronomically real rather than an approximation
// that assumes today's sky looks like the sky at birth.
//
// USAGE:
//   import { buildPredictions } from './transitPredictionEngine.js';
//   const events = buildPredictions(kundli.structured.planets, dashas, todaysPlanets);
//   // -> [{ date, transitPlanet, natalPlanet, aspectName, meaning, dashaLabel, ... }, ...]
// ═══════════════════════════════════════════════════════════════════════

// ── TRANSIT PREDICTION ENGINE ─────────────────────────────────
  const SIGN_NAMES=['Mesha','Vrishabha','Mithuna','Karka','Simha','Kanya','Tula','Vrishchika','Dhanu','Makara','Kumbha','Meena'];

  // Simple planet position approximation for next ~2 years
  // Uses mean daily motions from J2000
  const MEAN_MOTION = { // degrees per day
    Sun: 0.9856, Moon: 13.1764, Mars: 0.5240,
    Mercury: 1.3833, Jupiter: 0.0831, Venus: 1.2000,
    Saturn: 0.0334, Rahu: -0.0530, Ketu: -0.0530
  };

  function norm360(x){return((x%360)+360)%360;}

  function natalPlanetLon(planets, name){
    const p = planets.find(x=>x.name===name);
    return p ? p.sidereal.decimal : null;
  }

  function aspectName(deg){
    const map = {0:'Conjunction',60:'Sextile',90:'Square',120:'Trine',150:'Quincunx',180:'Opposition'};
    return map[deg] || `${deg}°`;
  }

  function signName(lon){ return SIGN_NAMES[Math.floor(((lon%360)+360)%360/30)]; }

  // Find when transiting planet enters a sign that aspects natal position
  function findSignIngresses(transitPlanet, natalPlanetName, natalPlanets, daysAhead = 730, currentPlanets){
    const natalLon = natalPlanetLon(natalPlanets, natalPlanetName);
    if(natalLon === null) return [];

    // ACCURACY FIX: this previously took the transiting planet's NATAL
    // (birth-moment) longitude and used it as the starting point for "today",
    // then projected forward from Date.now() — i.e. it silently assumed
    // "today's sky = the sky at birth". For any chart that isn't from today
    // that's wrong by however many years have elapsed (Jupiter alone drifts
    // ~30°/year, so a chart even a decade old could be many signs off).
    // `currentPlanets` — today's actual positions, computed by calling the
    // same accurate engine used for the natal chart, just for today's date —
    // is now used when available. Falls back to the old approximation only
    // if the caller doesn't supply it.
    const currentTransitP = (currentPlanets || natalPlanets).find(x=>x.name===transitPlanet);
    if(!currentTransitP) return [];

    const currentLon = currentTransitP.sidereal.decimal;
    const mm = MEAN_MOTION[transitPlanet] || 1;
    const results = [];

    const aspects = [0, 60, 90, 120, 150, 180];

    aspects.forEach(asp => {
      const targetLon = norm360(natalLon + asp);
      // Find crossing: when transit lon ≈ targetLon
      for(let day = 0; day <= daysAhead; day += (mm < 0.1 ? 10 : 3)){
        const lon = norm360(currentLon + mm * day);
        const lonNext = norm360(currentLon + mm * (day + (mm < 0.1 ? 10 : 3)));
        // Check if target crossed
        const d1 = norm360(lon - targetLon);
        const d2 = norm360(lonNext - targetLon);
        const s1 = d1 > 180 ? d1-360 : d1;
        const s2 = d2 > 180 ? d2-360 : d2;
        if(s1 * s2 < 0 && Math.abs(s1) < 30){
          const exactDay = day + (mm < 0.1 ? 5 : 1.5);
          const date = new Date(Date.now() + exactDay * 86400000);
          const exactLon = norm360(currentLon + mm * exactDay);
          results.push({
            day: exactDay,
            date,
            transitPlanet,
            natalPlanet: natalPlanetName,
            aspect: asp,
            aspectName: aspectName(asp),
            transitSign: signName(exactLon),
            strength: [0,120,60].includes(asp) ? 'strong' : [180,90].includes(asp) ? 'moderate' : 'weak'
          });
          day += (mm < 0.1 ? 90 : 20); // skip ahead to avoid duplicate detection
        }
      }
    });

    return results.sort((a,b) => a.day - b.day).slice(0, 4);
  }

  function buildPredictions(natalPlanets, dashas, currentPlanets){
    if(!natalPlanets || !dashas) return [];

    const events = [];

    // Key natal planets to watch
    const watchPairs = [
      {transit:'Jupiter', natal:'Sun'},
      {transit:'Jupiter', natal:'Moon'},
      {transit:'Jupiter', natal:'Jupiter'},
      {transit:'Jupiter', natal:'Ascendant'},
      {transit:'Saturn', natal:'Moon'},
      {transit:'Saturn', natal:'Sun'},
      {transit:'Saturn', natal:'Saturn'},
      {transit:'Mars', natal:'Moon'},
      {transit:'Venus', natal:'Venus'},
    ];

    watchPairs.forEach(pair => {
      const ingresses = findSignIngresses(pair.transit, pair.natal, natalPlanets, 730, currentPlanets);
      ingresses.forEach(ev => {
        // Find current dasha
        const activeDasha = dashas.find(d => d.isCurrent);
        const activeAntar = activeDasha?.bhuktis?.find(b => b.isCurrent);

        // Check dasha relevance
        const dashaLabel = activeDasha ? (activeAntar ? `${activeDasha.lord}/${activeAntar.lord}` : activeDasha.lord) : '—';

        // Build meaning
        let meaning = '';
        if(pair.transit === 'Jupiter'){
          if([0,120,60].includes(ev.aspect)) meaning = `Jupiter's grace flows toward natal ${pair.natal} — a period of expansion, opportunity, and divine favour.`;
          else if(ev.aspect === 180) meaning = `Jupiter opposes natal ${pair.natal} — tension between growth and stability; wisdom sought through balance.`;
          else meaning = `Jupiter challenges natal ${pair.natal} — growth comes through navigating obstacles with wisdom.`;
        } else if(pair.transit === 'Saturn'){
          if([0].includes(ev.aspect)) meaning = `Saturn returns to natal ${pair.natal} — karmic reckoning, deep restructuring, and the reward of disciplined effort.`;
          else if([120,60].includes(ev.aspect)) meaning = `Saturn supports natal ${pair.natal} with patient, structural energy — foundations built now endure.`;
          else meaning = `Saturn tests natal ${pair.natal} — perseverance and detachment are the keys to transformation.`;
        } else if(pair.transit === 'Mars'){
          meaning = `Mars activates natal ${pair.natal} — bursts of energy, decisive action, and heightened drive characterise this window.`;
        } else if(pair.transit === 'Venus'){
          meaning = `Venus graces natal ${pair.natal} — relationships, beauty, and material pleasures come into focus.`;
        }

        events.push({
          ...ev,
          dashaLabel,
          meaning,
          dateStr: ev.date.toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})
        });
      });
    });

    return events.sort((a,b) => a.day - b.day).slice(0, 18);
  }

export { buildPredictions };
