// trackB.js — optional "Precision Mode" client for the Swiss-Ephemeris
// Python backend (server/astro-python-backend/app.py). Entirely optional:
// the whole app works with Track A (pure JS, no install) if this is never
// called or the server isn't running.
export async function checkTrackBHealth(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e?.message || 'unreachable' };
  }
}

export async function calculateTrackB(baseUrl, birth) {
  const { year, month, day, hour, minute, lat, lon, tzOffset } = birth;
  const res = await fetch(`${baseUrl}/calculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year, month, day, hour, minute, lat, lon, tzOffset }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Precision backend returned HTTP ${res.status}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Precision backend returned an error');
  return data;
}
