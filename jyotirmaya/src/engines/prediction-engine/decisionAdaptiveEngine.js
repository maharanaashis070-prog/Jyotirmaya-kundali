// ═══════════════════════════════════════════════════════════════════════
// decisionAdaptiveEngine.js — Decision-Support + Self-Learning Prediction Engine
// Extracted & cleaned from surya-ai-brain-10-1-1.html ("Phase 8 + Phase 9")
//
// PHASE 8 (deterministic, Jyotish-correct):
//   SCORING_ENGINE  — scores a period from dasha lord + transits + yogas + strengths
//   TIMELINE_ENGINE — finds windows where dasha periods overlap transit events
//   DECISION_ENGINE — turns a score into plain-language advice per life domain
//   ALERT_ENGINE    — flags high-opportunity / high-risk windows
//
// PHASE 9 (adaptive, learns from user feedback over time):
//   OUTCOME_TRACKER      — records whether past predictions came true
//   FEEDBACK_ENGINE      — collects user ratings (+1/0/-1) on predictions
//   LEARNING_ENGINE      — nudges per-factor weights (dasha/transit/yoga/strength)
//                          based on feedback, bounded [0.5, 2.0], deterministic
//   PERSONALIZATION_ENGINE — builds a per-user accuracy profile
//   ADAPTIVE_SCORING     — base score (untouched) × learned weights + personal offset
//
// Design guarantee: the deterministic base score from SCORING_ENGINE is NEVER
// mutated — adaptive learning only scales/offsets on top, so "bad periods stay
// bad" even for users with high prediction accuracy (see ADAPTIVE_SCORING).
//
// STORAGE: Phase 9 modules persist to localStorage in the browser. A tiny
// in-memory fallback (_storage) is included below so this file also runs
// unmodified in Node/React Native/tests — swap `_storage` for a real DB
// (Postgres/SQLite/AsyncStorage) in production if you need data to survive
// across devices or app reinstalls.
//
// INPUT CONTRACT: `strengths` = Object.values(calcShadbala(kundli,isDay))
// (from chartCalculationEngine.js). `yogas` = detectYogas() output
// (from yogaDetectionEngine.js). `transits` = buildPredictions() output
// (from transitPredictionEngine.js). `dasha` = a single Vimshottari period
// {lord, startDate, endDate} (from chartCalculationEngine.js's calcDasha()).
//
// USAGE:
//   import { JYOTISH_ENGINE } from './decisionAdaptiveEngine.js';
//   const result = JYOTISH_ENGINE.runPipeline(dashaPeriods, transitEvents, yogas, strengths, userId);
//   // -> { windows: [...scored...], alerts: [...], decisions: [...per-domain advice...] }
//   JYOTISH_ENGINE.feedback.collectFeedback(predictionId, 1, 'career'); // teach it
// ═══════════════════════════════════════════════════════════════════════

// Portable storage shim: real localStorage in browsers, in-memory Map elsewhere.
const _storage = (typeof localStorage !== 'undefined') ? localStorage : (() => {
  const mem = new Map();
  return {
    getItem: k => mem.has(k) ? mem.get(k) : null,
    setItem: (k, v) => mem.set(k, String(v)),
    removeItem: k => mem.delete(k)
  };
})();

/* ════════════════════════════════════════════════════════════════
   PHASE 8 — Decision-Support Engine
   Modules: scoring-engine · timeline-engine · decision-engine · alert-engine
   ════════════════════════════════════════════════════════════════ */
const SCORING_ENGINE = (() => {
  'use strict';
  // Domain → Jyotish house + planet mapping (per Phase 8 spec)
  const DOMAIN_MAP = {
    career:       { houses: [2, 6, 10], planets: ['Sun', 'Saturn'] },
    marriage:     { houses: [7],        planets: ['Venus', 'Jupiter'] },
    finance:      { houses: [2, 11],    planets: ['Jupiter'] },
    health:       { houses: [6, 8],     planets: ['Mars', 'Saturn'] },
    // Added so all 5 domains the Probabilities screen tracks (marriage,
    // career, wealth, health, spirituality) have a matching decision —
    // previously spirituality had none, so the Oracle's "weakest domain"
    // guidance silently went missing whenever spirituality was weakest.
    spirituality: { houses: [9, 12],    planets: ['Ketu', 'Jupiter'] }
  };

  // BUG 6 FIX: map numeric aspect degrees → type strings used by scoring
  function _aspectType(t) {
    if (t.type) return t.type; // pass-through if already typed
    const asp = typeof t.aspect === 'number' ? t.aspect : -1;
    if (asp === 0)   return 'conjunction';
    if (asp === 120 || asp === 60) return 'trine';
    if (asp === 90)  return 'square';
    if (asp === 180) return 'opposition';
    return 'minor';
  }

  function scorePeriod(dasha, transits, yogas, strengths) {
    let score = 0;

    // ── Dasha ──
    const benefics = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
    const malefics = new Set(['Saturn', 'Rahu', 'Ketu', 'Mars']);
    if (benefics.has(dasha.lord)) score += 30;
    if (malefics.has(dasha.lord)) score -= 20;

    // ── Transits ── BUG 6 FIX: use _aspectType() to normalise transit type
    (transits || []).forEach(t => {
      const type = _aspectType(t);
      if (type === 'trine' || type === 'conjunction') score += 10;
      if (type === 'square' || type === 'opposition')  score -= 10;
    });

    // ── Yogas ── BUG 3 FIX: yoga types are lowercase ('raja','dhana','duryoga')
    (yogas || []).forEach(y => {
      if (y.type === 'raja')    score += 25;
      if (y.type === 'dhana')   score += 18;
      if (y.type === 'duryoga') score -= 20;
    });

    // ── Shadbala strength ── BUG 7 FIX: use s.total not s.strength; pct fallback
    (strengths || []).forEach(s => {
      const val = typeof s.total === 'number' ? s.total : (typeof s.pct === 'number' ? s.pct * 3.3 : 150);
      score += (val - 150) * 0.05;
    });

    return Math.round(score * 100) / 100;
  }

  // ACCURACY FIX (new): scorePeriod() above gives one *general* score for a
  // period. But "Per-domain decisions" previously reused that single number
  // for career/marriage/finance/health alike, so all four domains always
  // showed the same score and the same favorable/neutral/challenging level —
  // DOMAIN_MAP (which houses/planets actually govern each domain) was defined
  // but never used. scorePeriodForDomain() weights every factor by whether it
  // actually touches this domain's houses/planets, so career, marriage,
  // finance, and health can (and usually do) diverge.
  function scorePeriodForDomain(domain, dasha, transits, yogas, strengths) {
    const map = DOMAIN_MAP[domain];
    if (!map) return scorePeriod(dasha, transits, yogas, strengths);
    let score = 0;

    // ── Dasha: benefic/malefic baseline, amplified when the ruling planet
    // actually governs this domain (e.g. a Saturn dasha weighs on career far
    // more directly than on marriage) ──
    const benefics = new Set(['Jupiter', 'Venus', 'Mercury', 'Moon']);
    const malefics = new Set(['Saturn', 'Rahu', 'Ketu', 'Mars']);
    const dashaRulesDomain = dasha && map.planets.includes(dasha.lord);
    if (dasha && benefics.has(dasha.lord)) score += dashaRulesDomain ? 42 : 22;
    else if (dasha && malefics.has(dasha.lord)) score += dashaRulesDomain ? -30 : -14;
    else if (dashaRulesDomain) score += 12; // e.g. Sun ruling career, neither benefic nor malefic

    // ── Transits: full weight when the transiting or natal planet involved
    // is one this domain actually cares about; light "general climate"
    // weight otherwise ──
    (transits || []).forEach(t => {
      const type = _aspectType(t);
      const relevant = map.planets.includes(t.transitPlanet) || map.planets.includes(t.natalPlanet);
      const w = relevant ? 1 : 0.3;
      if (type === 'trine' || type === 'conjunction') score += 10 * w;
      if (type === 'square' || type === 'opposition')  score -= 10 * w;
    });

    // ── Yogas: raja/dhana lift career & finance most; any yoga naming one of
    // this domain's planets (e.g. Malavya/Venus for marriage, Ruchaka/Mars
    // for health) counts double; duryoga weighs heaviest on health ──
    (yogas || []).forEach(y => {
      const namesDomainPlanet = Array.isArray(y.planets) && y.planets.some(pn => map.planets.includes(pn));
      if (y.type === 'raja')  score += (domain === 'career' || domain === 'finance') ? 30 : (namesDomainPlanet ? 24 : 10);
      if (y.type === 'dhana') score += domain === 'finance' ? 32 : (namesDomainPlanet ? 16 : 5);
      if (y.type === 'duryoga') score -= domain === 'health' ? 28 : (namesDomainPlanet ? 22 : 12);
    });

    // ── Shadbala: only the planet(s) that actually govern this domain, when
    // that data is available (requires shadbala entries to carry `.name`) ──
    const named = (strengths || []).filter(s => typeof s.name === 'string');
    const domainStrengths = named.filter(s => map.planets.includes(s.name));
    const pool = domainStrengths.length ? domainStrengths : (named.length ? named : (strengths || []));
    const weight = domainStrengths.length ? 0.09 : 0.03;
    pool.forEach(s => {
      const val = typeof s.total === 'number' ? s.total : (typeof s.pct === 'number' ? s.pct * 3.3 : 150);
      score += (val - 150) * weight;
    });

    return Math.round(score * 100) / 100;
  }

  return { scorePeriod, scorePeriodForDomain, DOMAIN_MAP, _aspectType };
})();

const TIMELINE_ENGINE = (() => {
  'use strict';

  // BUG 4+5 FIX: helpers to normalise dasha and transit formats from the engines
  const JD_EPOCH = 2440587.5; // Unix epoch as JD
  function _dateToJD(d) { return JD_EPOCH + d.getTime() / 86400000; }

  // Extract JD from a dasha period (calcDasha_SE returns startDate/endDate as Date objects)
  function _dashaJD(d) {
    return {
      start: d.start != null ? d.start : _dateToJD(d.startDate),
      end:   d.end   != null ? d.end   : _dateToJD(d.endDate),
      lord:  d.lord
    };
  }

  // Extract JD from a transit event (TRANSIT_ENGINE returns day offset from now + date)
  function _transitJD(t) {
    if (t.jd != null) return t.jd;
    if (t.day != null) return JD_EPOCH + (Date.now() / 86400000) + t.day;
    if (t.date instanceof Date) return _dateToJD(t.date);
    return null;
  }

  function buildTimeline(dashaPeriods, transitEvents) {
    const windows = [];

    (dashaPeriods || []).forEach(d => {
      const nd = _dashaJD(d);
      (transitEvents || []).forEach(t => {
        const jd = _transitJD(t);
        if (jd == null) return;
        if (jd >= nd.start && jd <= nd.end) {
          windows.push({
            start: jd - 5,
            end:   jd + 5,
            dasha: nd.lord,
            // carry original transit data for downstream filtering
            _transit: t,
            score: 0
          });
        }
      });
    });
    windows.sort((a, b) => a.start - b.start);
    return windows;
  }

  function scoreTimeline(windows, dasha, transits, yogas, strengths) {
    return windows.map(w => ({
      ...w,
      score: SCORING_ENGINE.scorePeriod(
        { lord: w.dasha },
        // BUG 8 FIX (partial): filter transits to window timeframe
        (transits || []).filter(t => {
          const jd = _transitJD(t);
          return jd != null && jd >= w.start && jd <= w.end;
        }),
        yogas,
        strengths
      )
    }));
  }

  return { buildTimeline, scoreTimeline, _transitJD, _dateToJD };
})();

const DECISION_ENGINE = (() => {
  'use strict';
  const THRESHOLDS = { favor: 40, caution: -10 };

  const MESSAGES = {
    career:   { hi: 'Strong career period. Take initiative, seek advancement.', lo: 'Career caution. Avoid job changes or risky ventures.', mid: 'Stable career period. Proceed methodically.' },
    marriage: { hi: 'Auspicious for relationships. Good time for commitment.', lo: 'Relationship stress likely. Delay major decisions.',   mid: 'Moderate relational period. Communicate carefully.' },
    finance:  { hi: 'Favorable for investment and financial growth.',          lo: 'Financial risk elevated. Preserve capital.',           mid: 'Neutral finance period. Monitor closely.' },
    health:   { hi: 'Vitality high. Good period for wellness initiatives.',    lo: 'Health vulnerability. Prioritize rest and prevention.', mid: 'Routine health period. Maintain discipline.' },
    spirituality: { hi: 'Strong inner momentum. Meditation, pilgrimage, or study of scripture bear fruit now.', lo: 'Spiritual restlessness likely. Avoid drastic renunciation or belief shifts; steady the ground first.', mid: 'Steady inner period. Maintain your existing practice rather than starting anew.' }
  };

  function suggestAction(score, domain) {
    const m = MESSAGES[domain] || MESSAGES.career;
    if (score > THRESHOLDS.favor)   return { advice: m.hi,  level: 'favorable',   score };
    if (score < THRESHOLDS.caution) return { advice: m.lo,  level: 'challenging',  score };
    return                                 { advice: m.mid, level: 'neutral',      score };
  }

  // ACCURACY FIX: now takes the period's raw ingredients (dasha/transits/
  // yogas/strengths) and scores each domain independently via
  // SCORING_ENGINE.scorePeriodForDomain, instead of stamping every domain
  // with the same pre-computed `fallbackScore`. `fallbackScore` is kept as a
  // safety net for any caller that doesn't pass the extra arguments.
  function evaluateAllDomains(fallbackScore, dasha, transits, yogas, strengths) {
    return Object.keys(MESSAGES).map(domain => {
      const score = dasha
        ? SCORING_ENGINE.scorePeriodForDomain(domain, dasha, transits, yogas, strengths)
        : fallbackScore;
      return { domain, ...suggestAction(score, domain) };
    });
  }

  return { suggestAction, evaluateAllDomains };
})();

const ALERT_ENGINE = (() => {
  'use strict';
  const HIGH_OPP = 45, HIGH_RISK = -25;

  function generateAlerts(scoredTimeline) {
    const alerts = [];
    (scoredTimeline || []).forEach(w => {
      if (w.score >= HIGH_OPP) {
        alerts.push({
          type: 'opportunity',
          message: `High-opportunity window (${w.dasha} Dasha, score ${w.score.toFixed(1)})`,
          window: [w.start, w.end]
        });
      } else if (w.score <= HIGH_RISK) {
        alerts.push({
          type: 'risk',
          message: `High-risk window (${w.dasha} Dasha, score ${w.score.toFixed(1)})`,
          window: [w.start, w.end]
        });
      }
    });
    return alerts;
  }

  return { generateAlerts };
})();

/* ════════════════════════════════════════════════════════════════
   PHASE 9 — Self-Learning Adaptive System
   Modules: outcome-tracker · feedback-engine · learning-engine · personalization-engine
   ════════════════════════════════════════════════════════════════ */
const OUTCOME_TRACKER = (() => {
  'use strict';
  const STORE_KEY = 'sj_outcomes_v1';

  function _load() {
    try { return JSON.parse(_storage.getItem(STORE_KEY) || '{}'); }
    catch { return {}; }
  }
  function _save(data) {
    try { _storage.setItem(STORE_KEY, JSON.stringify(data)); }
    catch { console.warn('[OUTCOME_TRACKER] localStorage write failed'); }
  }

  // Immutable append — records cannot be modified once written
  function recordOutcome(userId, event) {
    const data = _load();
    if (!data[userId]) data[userId] = [];
    data[userId].push(Object.freeze({
      ...event,
      timestamp: Date.now(),
      id: `${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    }));
    _save(data);
  }

  function getOutcomes(userId) {
    return (_load()[userId] || []).map(o => Object.freeze({ ...o }));
  }

  return { recordOutcome, getOutcomes };
})();

const FEEDBACK_ENGINE = (() => {
  'use strict';
  const STORE_KEY = 'sj_feedback_v1';

  function _load() {
    try { return JSON.parse(_storage.getItem(STORE_KEY) || '[]'); }
    catch { return []; }
  }
  function _save(data) {
    try { _storage.setItem(STORE_KEY, JSON.stringify(data)); }
    catch { console.warn('[FEEDBACK_ENGINE] localStorage write failed'); }
  }

  // rating: +1 (accurate) | 0 (neutral) | -1 (incorrect)
  function collectFeedback(predictionId, rating, domain) {
    if (![1, 0, -1].includes(rating)) {
      console.warn('[FEEDBACK_ENGINE] invalid rating:', rating);
      return null;
    }
    const fb = { predictionId, rating, domain: domain || null, timestamp: Date.now() };
    const list = _load();
    list.push(fb);
    _save(list);
    // Route to learning engine (does NOT alter predictions directly)
    LEARNING_ENGINE.processFeedback(fb);
    return fb;
  }

  function getFeedback() { return _load(); }

  return { collectFeedback, getFeedback };
})();

const LEARNING_ENGINE = (() => {
  'use strict';
  const STORE_KEY  = 'sj_weights_v1';
  const LOG_KEY    = 'sj_weight_log_v1';
  const DELTA      = 0.03;
  const BOUNDS     = { min: 0.5, max: 2.0 };
  const DEFAULTS   = { dasha: 1.0, transit: 1.0, yoga: 1.0, strength: 1.0 };

  function _clamp(v) { return Math.max(BOUNDS.min, Math.min(BOUNDS.max, v)); }

  function _loadWeights() {
    try {
      const raw = JSON.parse(_storage.getItem(STORE_KEY));
      // BUG 13 FIX: validate all required keys exist and are numbers
      if (raw && typeof raw === 'object') {
        const keys = Object.keys(DEFAULTS);
        if (keys.every(k => typeof raw[k] === 'number')) return raw;
        // partial key set — merge with defaults
        return { ...DEFAULTS, ...Object.fromEntries(keys.filter(k => typeof raw[k] === 'number').map(k => [k, raw[k]])) };
      }
    } catch {}
    return { ...DEFAULTS };
  }

  function _saveWeights(w, reason) {
    try {
      _storage.setItem(STORE_KEY, JSON.stringify(w));
    } catch { console.warn('[LEARNING_ENGINE] weights write failed'); return; }
    // BUG 10 FIX: isolate log parse in its own try-catch so a corrupt log
    // doesn't silently swallow the weight save that already succeeded above
    try {
      const log = JSON.parse(_storage.getItem(LOG_KEY) || '[]');
      log.push({ weights: { ...w }, reason, timestamp: Date.now() });
      _storage.setItem(LOG_KEY, JSON.stringify(log.slice(-200)));
    } catch { console.warn('[LEARNING_ENGINE] weight log write failed'); }
  }

  function getWeights() { return { ..._loadWeights() }; }

  function resetWeights() {
    _saveWeights({ ...DEFAULTS }, 'manual_reset');
  }

  const DOMAIN_AXIS = {
    career:   ['dasha', 'strength'],
    marriage: ['yoga',  'transit'],
    finance:  ['dasha', 'yoga'],
    health:   ['transit', 'strength'],
    general:  ['dasha', 'transit', 'yoga', 'strength']
  };

  function processFeedback(fb) {
    const w = _loadWeights();
    const axes = DOMAIN_AXIS[fb.domain] || DOMAIN_AXIS.general;
    const adj  = fb.rating * DELTA;
    axes.forEach(axis => {
      w[axis] = _clamp(w[axis] + adj);
    });
    _saveWeights(w, `feedback:${fb.predictionId}:rating${fb.rating}`);
  }

  function getWeightLog() {
    try { return JSON.parse(_storage.getItem(LOG_KEY) || '[]'); }
    catch { return []; }
  }

  return { getWeights, resetWeights, processFeedback, getWeightLog };
})();

const PERSONALIZATION_ENGINE = (() => {
  'use strict';
  // BUG 12 FIX: cache profiles to avoid rebuilding on every scorePeriodAdaptive call
  const _profileCache = new Map();

  function buildUserProfile(userId) {
    if (_profileCache.has(userId)) return _profileCache.get(userId);

    const outcomes = OUTCOME_TRACKER.getOutcomes(userId);
    const feedback = FEEDBACK_ENGINE.getFeedback();

    const total    = outcomes.length;
    const success  = outcomes.filter(o => o.result === 'positive').length;
    // BUG 11 FIX: removed unused `negative` variable
    const accuracy = total ? success / total : 0.5;

    const domainStats = {};
    outcomes.forEach(o => {
      if (!o.domain) return;
      if (!domainStats[o.domain]) domainStats[o.domain] = { hit: 0, total: 0 };
      domainStats[o.domain].total++;
      if (o.result === 'positive') domainStats[o.domain].hit++;
    });
    const domainAccuracy = {};
    Object.entries(domainStats).forEach(([d, s]) => {
      domainAccuracy[d] = s.total ? s.hit / s.total : 0.5;
    });

    const ratingSum = feedback.reduce((s, f) => s + f.rating, 0);
    const bias = ratingSum > 0 ? 'optimistic' : ratingSum < 0 ? 'conservative' : 'balanced';

    // BUG 9 FIX: interpretationMultiplier must not invert sign of negative scores.
    // Use additive offset (capped) instead of multiplicative — keeps challenging periods
    // challenging even after high accuracy. Range: [-5, +5] additive on base score.
    const accuracyOffset = (accuracy - 0.5) * 10;  // -5 to +5

    const profile = {
      userId,
      total,
      accuracy: Math.round(accuracy * 100) / 100,
      bias,
      domainAccuracy,
      accuracyOffset,  // additive, not multiplicative
      weights: LEARNING_ENGINE.getWeights()
    };

    _profileCache.set(userId, profile);
    // Invalidate cache after 60s so new outcomes are reflected
    setTimeout(() => _profileCache.delete(userId), 60000);
    return profile;
  }

  return { buildUserProfile };
})();

/* ════════════════════════════════════════════════════════════════
   ADAPTIVE SCORING INTEGRATION
   Base score untouched; learned weights applied on top.
   Same input + same weights → same output (deterministic).
   ════════════════════════════════════════════════════════════════ */
const ADAPTIVE_SCORING = (() => {
  'use strict';

  function scorePeriodAdaptive(dasha, transits, yogas, strengths, userId) {
    // Step 1: deterministic base score (Jyotish correct, never modified)
    const baseScore = SCORING_ENGINE.scorePeriod(dasha, transits, yogas, strengths);

    // Step 2: learned weight multiplier (1.0 when all weights at default)
    const w = LEARNING_ENGINE.getWeights();
    const wMul = w.dasha * 0.30 + w.transit * 0.30 + w.yoga * 0.20 + w.strength * 0.20;

    // Step 3: personalization — additive offset (BUG 9 FIX: not multiplicative;
    // multiplicative inverts sign on negative scores, making bad periods look worse
    // for high-accuracy users and better for low-accuracy users — logically wrong)
    let pOffset = 0;
    if (userId) {
      const profile = PERSONALIZATION_ENGINE.buildUserProfile(userId);
      pOffset = profile.accuracyOffset ?? 0;
    }

    return Math.round((baseScore * wMul + pOffset) * 100) / 100;
  }

  return { scorePeriodAdaptive };
})();

/* ═══════════════════ PHASE 8+9 PIPELINE ENTRY POINT ═══════════════════ */
const JYOTISH_ENGINE = {
  // Phase 8
  score:    SCORING_ENGINE,
  timeline: TIMELINE_ENGINE,
  decide:   DECISION_ENGINE,
  alert:    ALERT_ENGINE,
  // Phase 9
  outcomes:     OUTCOME_TRACKER,
  feedback:     FEEDBACK_ENGINE,
  learning:     LEARNING_ENGINE,
  personalize:  PERSONALIZATION_ENGINE,
  adaptive:     ADAPTIVE_SCORING,

  // ── Convenience: run full pipeline ──
  runPipeline(dashaPeriods, transitEvents, yogas, strengths, userId) {
    const windows  = TIMELINE_ENGINE.buildTimeline(dashaPeriods, transitEvents);
    // BUG 8 FIX: each window scores only its own transits (filtered by timeframe),
    // not the full transitEvents array
    const scored   = windows.map(w => {
      const windowTransits = (transitEvents || []).filter(t => {
        const jd = TIMELINE_ENGINE._transitJD(t);
        return jd != null && jd >= w.start && jd <= w.end;
      });
      return {
        ...w,
        score: ADAPTIVE_SCORING.scorePeriodAdaptive(
          { lord: w.dasha }, windowTransits, yogas, strengths, userId
        ),
        _transits: windowTransits
      };
    });
    const alerts   = ALERT_ENGINE.generateAlerts(scored);
    const topWindow = scored.length ? scored.reduce((a, b) => a.score > b.score ? a : b) : null;
    const topScore = topWindow ? topWindow.score : 0;
    // ACCURACY FIX: each life domain now gets its own score derived from the
    // top window's actual dasha lord + transits, weighted by DOMAIN_MAP, so
    // career/marriage/finance/health can genuinely diverge instead of all
    // four always showing the single overall topScore.
    const decisions = DECISION_ENGINE.evaluateAllDomains(
      topScore,
      topWindow ? { lord: topWindow.dasha } : null,
      topWindow ? topWindow._transits : [],
      yogas,
      strengths
    );
    return { windows: scored.map(({ _transits, ...w }) => w), alerts, decisions };
  }
};

export { JYOTISH_ENGINE, SCORING_ENGINE, TIMELINE_ENGINE, DECISION_ENGINE, ALERT_ENGINE, OUTCOME_TRACKER, FEEDBACK_ENGINE, LEARNING_ENGINE, PERSONALIZATION_ENGINE, ADAPTIVE_SCORING };
