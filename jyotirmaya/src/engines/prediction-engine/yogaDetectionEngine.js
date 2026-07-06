// ═══════════════════════════════════════════════════════════════════════
// yogaDetectionEngine.js — Vedic Yoga (planetary combination) Detection
// Extracted & cleaned from surya-ai-brain-10-1-1.html
//
// Detects classical Vedic yogas from a natal chart: Raja Yoga, Gajakesari,
// Budhaditya, Chandra-Mangal, Dhana Yoga, the five Pancha Mahapurusha yogas
// (Hamsa/Malavya/Ruchaka/Sasa — Bhadra omitted upstream), Viparita Raja Yoga,
// and the affliction Kemadruma Yoga.
//
// INPUT CONTRACT: expects the `structured.planets` array shape produced by
// chartCalculationEngine.js's calcKundli(): each planet is
//   { name, bhavaRashi (1-12 house), rashi:{idx}, ... }
// and `lagnaIdx` = structured.lagna.rashiIdx (0-11 sign index of ascendant).
//
// USAGE:
//   import { detectYogas } from './yogaDetectionEngine.js';
//   const yogas = detectYogas(kundli.structured.planets, kundli.structured.lagna.rashiIdx);
//   // -> [{ type:'raja', name:'Gajakesari Yoga', desc:'...', planets:[...], strength:'strong' }, ...]
// ═══════════════════════════════════════════════════════════════════════

// ── YOGA DETECTION ENGINE ────────────────────────────────────

  const KENDRA = [1,4,7,10];
  const TRIKONA = [1,5,9];
  const TRIK = [6,8,12];

  // Get house lord name from house index
  function houseLord(houseIdx, lagnaIdx){
    const SIGN_LORDS = ['Mars','Venus','Mercury','Moon','Sun','Mercury','Venus','Mars','Jupiter','Saturn','Saturn','Jupiter'];
    const signIdx = (lagnaIdx + houseIdx - 1) % 12;
    return SIGN_LORDS[signIdx];
  }

  function detectYogas(planets, lagnaIdx){
    const yogas = [];
    const byName = {};
    planets.forEach(p => { byName[p.name] = p; });

    const sunP = byName['Sun'], moonP = byName['Moon'], jupP = byName['Jupiter'];
    const venP = byName['Venus'], satP = byName['Saturn'], marP = byName['Mars'];
    const merP = byName['Mercury'];

    function house(p){ return p ? p.bhavaRashi : null; }

    // ── RAJA YOGAS ── ACCURACY FIX: previous version checked whether any two
    // PLANETS sat in a kendra house (1,4,7,10) and trikona house (1,5,9), then
    // required ph===qh. Since kendra ∩ trikona = {house 1} only, that reduced
    // to "any two planets conjunct in house 1" — not the classical rule, and
    // regardless of whether either planet actually rules a kendra/trikona house.
    // Real Parashari rule: find LORDS of kendra houses and LORDS of trikona
    // houses (from Lagna); a kendra-lord conjunct or mutually-aspecting a
    // trikona-lord forms Raja Yoga. Vedic aspects: every planet aspects the
    // 7th house from itself; Mars also 4th/8th, Jupiter 5th/9th, Saturn 3rd/10th.
    const SPECIAL_DRISHTI = { Mars: [4, 8], Jupiter: [5, 9], Saturn: [3, 10] };
    function housesAspectedBy(planetName, fromHouse) {
      const out = new Set([((fromHouse + 6 - 1) % 12) + 1]);
      (SPECIAL_DRISHTI[planetName] || []).forEach(off => out.add(((fromHouse + off - 1) % 12) + 1));
      return out;
    }
    const kendraLords = [...new Set(KENDRA.map(h => houseLord(h, lagnaIdx)))];
    const trikonaLords = [...new Set(TRIKONA.map(h => houseLord(h, lagnaIdx)))];
    const seenRajaPairs = new Set();
    kendraLords.forEach(kLordName => {
      trikonaLords.forEach(tLordName => {
        if (kLordName === tLordName) return;
        const pairKey = [kLordName, tLordName].sort().join('~');
        if (seenRajaPairs.has(pairKey)) return;
        const kP = byName[kLordName], tP = byName[tLordName];
        if (!kP || !tP) return;
        const kH = house(kP), tH = house(tP);
        if (!kH || !tH) return;
        const conjunct = kH === tH;
        const mutualAspect = housesAspectedBy(kLordName, kH).has(tH) && housesAspectedBy(tLordName, tH).has(kH);
        if (conjunct || mutualAspect) {
          seenRajaPairs.add(pairKey);
          yogas.push({
            type: 'raja', name: 'Raja Yoga',
            desc: `${kLordName} (lord of a kendra/angular house) and ${tLordName} (lord of a trikona/trine house) are ${conjunct ? `conjunct together in house ${kH}` : 'linked by mutual planetary aspect'} — the classical union of angle and trine lords, bestowing authority, rising status, and durable success. (Sign-exchange/parivartana Raja Yoga is not modeled separately.)`,
            planets: [kLordName, tLordName], strength: 'strong'
          });
        }
      });
    });


    // ── GAJAKESARI YOGA ── Jupiter in kendra from Moon
    if(jupP && moonP){
      const moonH = house(moonP), jupH = house(jupP);
      if(moonH && jupH){
        const diff = Math.abs(jupH - moonH);
        if([0,3,6,9].includes(diff) || [0,3,6,9].includes(12-diff)){
          yogas.push({
            type:'raja', name:'Gajakesari Yoga',
            desc:'Jupiter stands in angular relation to the Moon — a supremely auspicious combination bestowing wisdom, eloquence, fame, and enduring prosperity.',
            planets:['Jupiter','Moon'], strength:'strong'
          });
        }
      }
    }

    // ── BUDHADITYA YOGA ── Sun and Mercury together
    if(sunP && merP && house(sunP) === house(merP)){
      yogas.push({
        type:'raja', name:'Budhaditya Yoga',
        desc:'The Sun and Mercury conjoin, merging solar authority with mercurial intellect — granting exceptional communication, scholarship, and professional distinction.',
        planets:['Sun','Mercury'], strength:'strong'
      });
    }

    // ── CHANDRA-MANGAL YOGA ── Moon and Mars together
    if(moonP && marP && house(moonP) === house(marP)){
      yogas.push({
        type:'dhana', name:'Chandra-Mangal Yoga',
        desc:'Moon and Mars unite emotional intuition with decisive action — a powerful yoga for wealth accumulation and business acumen.',
        planets:['Moon','Mars'], strength:'moderate'
      });
    }

    // ── DHANA YOGAS ── 2nd/11th lords in strength
    const lord2H = house(byName[houseLord(2, lagnaIdx)]);
    const lord11H = house(byName[houseLord(11, lagnaIdx)]);
    if(lord2H && (KENDRA.includes(lord2H) || TRIKONA.includes(lord2H))){
      yogas.push({
        type:'dhana', name:'Dhana Yoga (2nd Lord)',
        desc:'The lord of wealth is powerfully placed in an angular or triangular house, activating the flow of material abundance and financial stability.',
        planets:[houseLord(2, lagnaIdx)], strength:'moderate'
      });
    }
    // BUG FIX: this block's own header comment says "2nd/11th lords", and
    // lord11H was already being computed above, but no matching check for it
    // existed — the 11th-lord half of this yoga was silently never detected.
    if(lord11H && (KENDRA.includes(lord11H) || TRIKONA.includes(lord11H))){
      yogas.push({
        type:'dhana', name:'Dhana Yoga (11th Lord)',
        desc:'The lord of gains is powerfully placed in an angular or triangular house, supporting steady income and the fulfilment of material desires.',
        planets:[houseLord(11, lagnaIdx)], strength:'moderate'
      });
    }

    // ── HAMSA YOGA ── Jupiter in own sign or exalted in kendra
    if(jupP){
      const jupH = house(jupP), jupSign = jupP.rashi?.idx;
      const jupOwnOrExalt = [3,8,11].includes(jupSign); // Cancer(3)=exalt, Sag(8)/Pisces(11)=own
      if(jupOwnOrExalt && jupH && KENDRA.includes(jupH)){
        yogas.push({
          type:'raja', name:'Hamsa Yoga (Pancha Mahapurusha)',
          desc:'Jupiter — the cosmic Guru — sits exalted or in own sign in an angular house. This Mahapurusha Yoga blesses with profound wisdom, spiritual authority, and distinguished fortune.',
          planets:['Jupiter'], strength:'strong'
        });
      }
    }

    // ── MALAVYA YOGA ── Venus in own/exalt in kendra
    if(venP){
      const venH = house(venP), venSign = venP.rashi?.idx;
      const venOwnOrExalt = [1,6,11].includes(venSign); // Taurus(1)/Libra(6)=own, Pisces(11)=exalt
      if(venOwnOrExalt && venH && KENDRA.includes(venH)){
        yogas.push({
          type:'raja', name:'Malavya Yoga (Pancha Mahapurusha)',
          desc:'Venus is exalted or in own sign in an angular house — the Malavya Mahapurusha Yoga granting extraordinary beauty, artistic genius, material pleasures, and romantic magnetism.',
          planets:['Venus'], strength:'strong'
        });
      }
    }

    // ── RUCHAKA YOGA ── Mars in own/exalt in kendra
    if(marP){
      const marH = house(marP), marSign = marP.rashi?.idx;
      const marOwnOrExalt = [0,7,9].includes(marSign); // Aries(0)/Scorpio(7)=own, Capricorn(9)=exalt
      if(marOwnOrExalt && marH && KENDRA.includes(marH)){
        yogas.push({
          type:'raja', name:'Ruchaka Yoga (Pancha Mahapurusha)',
          desc:'Mars blazes from its own or exalted sign in a kendra — the Ruchaka Mahapurusha Yoga conferring exceptional physical vitality, courage, authority, and capacity for achievement.',
          planets:['Mars'], strength:'strong'
        });
      }
    }

    // ── SASA YOGA ── Saturn in own/exalt in kendra
    if(satP){
      const satH = house(satP), satSign = satP.rashi?.idx;
      const satOwnOrExalt = [6,9,10].includes(satSign); // Libra(6)=exalt, Cap(9)/Aqua(10)=own
      if(satOwnOrExalt && satH && KENDRA.includes(satH)){
        yogas.push({
          type:'raja', name:'Sasa Yoga (Pancha Mahapurusha)',
          desc:'Saturn commands from own or exalted sign in an angle — the Sasa Mahapurusha Yoga granting mastery over masses, administrative power, and the discipline to build enduring legacies.',
          planets:['Saturn'], strength:'strong'
        });
      }
    }

    // ── VIPARITA RAJA YOGA ── ACCURACY FIX: the previous version flagged this
    // yoga whenever any 2+ classical planets simply sat in houses 6/8/12 — that
    // is not the classical condition and over-triggered on ordinary charts. The
    // actual Parashari rule looks at the LORDS of the 6th, 8th, and 12th houses
    // and checks whether each sits in a *different* dusthana (6/8/12) from its
    // own — three named sub-yogas: Harsha (6th lord in 8th/12th), Sarala (8th
    // lord in 6th/12th), Vimala (12th lord in 6th/8th). A lord found in its own
    // dusthana house doesn't count — that's just an own-house placement, not
    // the "flees to another difficulty" inversion the yoga is named for.
    const VIPARITA_SUBYOGA = { 6: 'Harsha', 8: 'Sarala', 12: 'Vimala' };
    [6, 8, 12].forEach(dusthana => {
      const lordName = houseLord(dusthana, lagnaIdx);
      const lordP = byName[lordName];
      if (!lordP) return;
      const lordHouse = house(lordP);
      if (lordHouse && TRIK.includes(lordHouse) && lordHouse !== dusthana) {
        yogas.push({
          type: 'nabhasa', name: `Viparita Raja Yoga (${VIPARITA_SUBYOGA[dusthana]})`,
          desc: `The lord of the ${dusthana}th house retreats into another house of difficulty (house ${lordHouse}) rather than strengthening it — a paradoxical inversion that transmutes obstacles into unexpected power and rises after adversity.`,
          planets: [lordName], strength: 'moderate'
        });
      }
    });

    // ── KEMADRUMA YOGA ── Moon with no planets in adjacent houses (affliction)
    if(moonP){
      const mH = house(moonP);
      if(mH){
        const adj1 = ((mH-2+12)%12)+1, adj2 = (mH%12)+1;
        const hasAdj = planets.some(p => p.name !== 'Moon' && p.name !== 'Rahu' && p.name !== 'Ketu' && (house(p)===adj1 || house(p)===adj2));
        if(!hasAdj){
          yogas.push({
            type:'duryoga', name:'Kemadruma Yoga',
            desc:'The Moon stands alone with no planetary support in adjacent houses — bringing periods of isolation, unexpected reversals, and the need to cultivate inner resilience.',
            planets:['Moon'], strength:'weak'
          });
        }
      }
    }

    // Deduplicate by name
    const seen = new Set();
    return yogas.filter(y => {
      if(seen.has(y.name)) return false;
      seen.add(y.name); return true;
    });
  }

export { detectYogas };
