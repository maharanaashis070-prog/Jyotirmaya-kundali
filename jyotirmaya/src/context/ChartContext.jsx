import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useProfiles } from './ProfileContext.jsx';
import { useSettings } from './SettingsContext.jsx';
import { computeFullChart } from '../lib/adapters.js';
import { checkTrackBHealth, calculateTrackB } from '../lib/trackB.js';

const ChartContext = createContext(null);

export function ChartProvider({ children }) {
  const { activeProfile } = useProfiles();
  const { settings } = useSettings();
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const [trackBNote, setTrackBNote] = useState(null); // { level: 'info'|'warn', message }

  const recompute = useCallback(async () => {
    if (!activeProfile) {
      setState({ status: 'idle', data: null, error: null });
      return;
    }
    setState(prev => ({ ...prev, status: 'loading' }));
    setTrackBNote(null);

    const birth = {
      year: activeProfile.year, month: activeProfile.month, day: activeProfile.day,
      hour: activeProfile.hour, minute: activeProfile.minute,
      lat: activeProfile.lat, lon: activeProfile.lon, tzOffset: activeProfile.tzOffset,
    };

    let trackBChartData = null;
    if (settings.precisionMode) {
      const health = await checkTrackBHealth(settings.trackBUrl);
      if (health.ok) {
        try {
          trackBChartData = await calculateTrackB(settings.trackBUrl, birth);
          setTrackBNote({ level: 'info', message: 'Precision Mode active — Life-Area Probabilities use the Swiss Ephemeris backend. Kundli, Dasha, Yogas, and Transits always use the pure-JS engine (Track A), per the dasha contract.' });
        } catch (e) {
          setTrackBNote({ level: 'warn', message: `Precision backend reachable but returned an error (${e.message}). Showing pure-JS (Track A) results instead.` });
        }
      } else {
        setTrackBNote({ level: 'warn', message: `Precision backend not reachable at ${settings.trackBUrl} (${health.error}). Start it locally (see Settings) or turn Precision Mode off. Showing pure-JS (Track A) results.` });
      }
    }

    try {
      const data = computeFullChart(birth, activeProfile.id, trackBChartData);
      setState({ status: 'ready', data, error: null });
    } catch (e) {
      console.error('[ChartContext] compute failed', e);
      setState({ status: 'error', data: null, error: e?.message || 'Calculation failed.' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile, settings.precisionMode, settings.trackBUrl]);

  useEffect(() => { recompute(); }, [recompute]);

  const value = useMemo(() => ({ ...state, trackBNote, refresh: recompute }), [state, trackBNote, recompute]);
  return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
}

export function useChart() {
  const ctx = useContext(ChartContext);
  if (!ctx) throw new Error('useChart must be used within ChartProvider');
  return ctx;
}
