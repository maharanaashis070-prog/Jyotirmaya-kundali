import { useState } from 'react';
import { Moon, RefreshCw, Sparkles, WifiOff } from 'lucide-react';
import Card from '../common/Card.jsx';
import Badge from '../common/Badge.jsx';
import { offlineOracleGenerate } from '../../engines/ai-offline-engine/offlineOracle.js';

const SCORE_LABELS = {
  career_growth: 'Career growth', financial_gain: 'Financial gain', relationship_harmony: 'Relationship harmony',
  health_stability: 'Health stability', mental_clarity: 'Mental clarity', spiritual_progress: 'Spiritual progress',
  risk_factor: 'Risk factor', favorable_period_days: 'Favorable in',
};

// data: the full computeFullChart() bundle from useChart() — passed down so
// the reading below is this profile's own dasha/yoga/transit/probability
// data, not a generic placeholder (see engines/ai-offline-engine/*.js for
// exactly how each number is derived).
//
// FULLY OFFLINE BY DESIGN: this card no longer has any network code path at
// all. offlineOracleGenerate() runs entirely on-device, synchronously under
// the hood — nothing about your birth chart is ever sent anywhere.
export default function CosmicOracleCard({ data }) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState(0);

  async function generate() {
    setLoading(true);
    const nextVariant = variant + 1;
    const r = await offlineOracleGenerate(data, nextVariant);
    setVariant(nextVariant);
    setReading(r);
    setLoading(false);
  }

  return (
    <Card className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-25"
        style={{ background: 'radial-gradient(circle, var(--color-gold) 0%, transparent 70%)' }}
      />
      <div className="relative flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-indigo" />
          <h3 className="font-display text-lg text-indigo">Cosmic Oracle</h3>
        </div>
        <Badge tone="teal"><WifiOff size={11} /> Fully offline</Badge>
      </div>
      <p className="relative text-xs text-ink/50 mb-3">
        A long-form reading composed entirely on this device — your current dasha, every classical yoga, upcoming
        transits, all five life-area scores, planetary strength, a risk composite, and focused guidance, all read
        straight from your own computed chart. No network call, no API, no key — nothing here is ever sent anywhere.
      </p>
      {!reading ? (
        <button onClick={generate} disabled={loading} className="relative rounded-md bg-indigo text-ivory px-4 py-2 text-sm font-medium hover:bg-indigo-light transition-colors disabled:opacity-60 flex items-center gap-1.5">
          {loading ? 'Drawing a reading…' : <><Sparkles size={14} /> Draw a reading</>}
        </button>
      ) : (
        <div className="relative">
          <p className="text-sm text-ink/75 whitespace-pre-line leading-relaxed">{reading.narrative}</p>
          {reading.scores && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {Object.entries(reading.scores).filter(([k]) => SCORE_LABELS[k]).map(([k, v]) => (
                <div key={k} className="rounded-md bg-indigo/5 border border-indigo/10 px-2.5 py-2">
                  <p className="text-[10px] text-ink/45 uppercase tracking-wide">{SCORE_LABELS[k]}</p>
                  <p className="font-display text-indigo">{v}{typeof v === 'number' && k !== 'favorable_period_days' ? '%' : k === 'favorable_period_days' ? 'd' : ''}</p>
                </div>
              ))}
            </div>
          )}
          <p className="text-[11px] text-ink/40 mt-3">Same numbers as the Probabilities page — calculated from your chart, not generic.</p>
          <button onClick={generate} disabled={loading} className="mt-3 flex items-center gap-1.5 text-xs text-teal underline underline-offset-2">
            <RefreshCw size={12} /> {loading ? 'Drawing…' : 'Draw another'}
          </button>
        </div>
      )}
    </Card>
  );
}
