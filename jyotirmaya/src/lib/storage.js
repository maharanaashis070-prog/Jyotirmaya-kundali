// storage.js — this app's OWN persistence (saved birth profiles + settings).
// Deliberately namespaced away from the prediction engine's own `sj_*` keys
// (decisionAdaptiveEngine.js writes sj_weights_v1 / sj_feedback_v1 /
// sj_outcomes_v1 itself) so the two never collide, while both still live in
// the same browser's localStorage — see the Settings screen for the
// per-device-not-per-account disclosure this implies.
//
// Hardened for file:// double-click use: some browsers restrict or disable
// localStorage for the file:// origin (or in private/incognito modes). If
// any read/write throws, we transparently fall back to an in-memory store
// for the rest of the session instead of crashing the app — data simply
// won't survive a page reload in that specific situation.
const PROFILES_KEY = 'surya_profiles_v1';
const ACTIVE_KEY = 'surya_active_profile_v1';
const SETTINGS_KEY = 'surya_settings_v1';

const memoryFallback = new Map();
let warnedOnce = false;

function warnOnce() {
  if (!warnedOnce) {
    warnedOnce = true;
    console.warn('[storage] localStorage unavailable in this context (possibly file:// or private browsing) — using in-memory storage for this session only.');
  }
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    warnOnce();
    return memoryFallback.has(key) ? memoryFallback.get(key) : null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    warnOnce();
    memoryFallback.set(key, value);
  }
}

function safeParse(raw, fallback) {
  try { const v = JSON.parse(raw); return v == null ? fallback : v; }
  catch { return fallback; }
}

export function loadProfiles() {
  return safeParse(safeGet(PROFILES_KEY), []);
}

export function saveProfiles(profiles) {
  safeSet(PROFILES_KEY, JSON.stringify(profiles));
}

export function upsertProfile(profile) {
  const profiles = loadProfiles();
  const idx = profiles.findIndex(p => p.id === profile.id);
  if (idx >= 0) profiles[idx] = profile;
  else profiles.push(profile);
  saveProfiles(profiles);
  return profiles;
}

export function deleteProfile(id) {
  const profiles = loadProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
  return profiles;
}

export function getActiveProfileId() {
  return safeGet(ACTIVE_KEY) || null;
}

export function setActiveProfileId(id) {
  safeSet(ACTIVE_KEY, id);
}

const DEFAULT_SETTINGS = {
  precisionMode: false,      // Track B toggle (off = pure-JS Track A, always available)
  language: 'en',            // 'en' | 'or' | 'hi'
  chartStyle: 'north',       // 'north' | 'south'
  trackBUrl: 'http://localhost:3001',
  // The Cosmic Oracle is fully offline, unconditionally — it was previously
  // possible to opt into a "Live Oracle" mode that sent a chart summary to a
  // free text-AI endpoint for re-phrasing. That code path has been removed
  // entirely (not just turned off) so there is no network call anywhere in
  // the Oracle, full stop.
};

export function loadSettings() {
  return { ...DEFAULT_SETTINGS, ...safeParse(safeGet(SETTINGS_KEY), {}) };
}

export function saveSettings(settings) {
  safeSet(SETTINGS_KEY, JSON.stringify(settings));
}

export function makeProfileId() {
  return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
}
