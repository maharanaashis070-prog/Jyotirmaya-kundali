// timezone.js — derives an accurate historical UTC offset for a birth date
// purely from latitude/longitude, entirely offline (no network, no API key).
//
// Pipeline: lat/lon -> IANA zone name (tz-lookup, bundled offline data)
//           -> UTC offset *at that specific historic date* (Intl, handles
//              decades of DST-rule changes correctly, unlike a fixed offset).
import tzlookup from 'tz-lookup';

export function ianaZoneFor(lat, lon) {
  try {
    return tzlookup(lat, lon);
  } catch {
    return null; // e.g. lat/lon over open ocean with no defined zone
  }
}

function offsetAtInstant(date, timeZone) {
  // Format the same instant twice — once "as UTC", once "as timeZone" —
  // then diff. Because both strings are parsed by the same JS Date engine
  // under the same (irrelevant) local-timezone assumption, that assumption
  // cancels out of the subtraction, leaving the true UTC offset in hours.
  const fmt = (tz) => new Date(date.toLocaleString('en-US', { timeZone: tz, hour12: false }));
  const utc = fmt('UTC');
  const local = fmt(timeZone);
  return (local.getTime() - utc.getTime()) / 3600000;
}

/**
 * UTC offset (hours, e.g. 5.5) for a given IANA zone at a specific
 * civil (wall-clock) date & time — correct across historical DST changes.
 */
export function offsetHoursFor(ianaZone, { year, month, day, hour, minute }) {
  if (!ianaZone) return 0;
  const naiveUTC = Date.UTC(year, month - 1, day, hour, minute);
  const guess = new Date(naiveUTC);
  const off1 = offsetAtInstant(guess, ianaZone);
  const refined = new Date(naiveUTC - off1 * 3600000);
  const off2 = offsetAtInstant(refined, ianaZone);
  return Math.round(off2 * 100) / 100;
}

export function offsetLabel(offsetHours) {
  if (offsetHours == null || Number.isNaN(offsetHours)) return '—';
  const sign = offsetHours >= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);
  const h = Math.floor(abs);
  const m = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}
