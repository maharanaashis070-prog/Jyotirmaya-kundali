import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import ChartWheel from '../components/chart/ChartWheel.jsx';
import HouseDetailPanel from '../components/chart/HouseDetailPanel.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { SIGN_NAMES, calcVarga } from '../engines/chart-engine/chartCalculationEngine.js';
import { planetCode } from '../components/chart/planetGlyphs.js';

const VARGAS = [
  { key: 'D1', label: 'D1 · Rasi', desc: 'The main birth chart — physical body, overall life.' },
  { key: 'D9', label: 'D9 · Navamsa', desc: 'Marriage, dharma, and the inner strength of every planet.' },
  { key: 'D10', label: 'D10 · Dashamsa', desc: 'Career, profession, and public standing.' },
  { key: 'D12', label: 'D12 · Dwadasamsa', desc: 'Parents and ancestry.' },
];

export default function VargaPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { settings, update, t } = useSettings();
  const [active, setActive] = useState('D9');
  const [selectedHouse, setSelectedHouse] = useState(null);

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { structured } = data;
  const meta = VARGAS.find(v => v.key === active);

  // BUG FIX: this page used to render only a plain sign-grouped list — no
  // diagram at all, and the North/South chart-style setting (used everywhere
  // else in the app) was silently ignored here. It's the same diamond/square
  // ChartWheel used on the Dashboard, just fed varga-sign positions instead
  // of D1 positions. The lagna's own varga sign is computed with the same
  // calcVarga() the engine already uses for planets — not a re-derived rule.
  const lagnaVargaSign = active === 'D1'
    ? structured.lagna.rashiIdx
    : calcVarga(structured.lagna.decimal)[active].sign;

  const vargaPlanets = structured.planets.map(p => {
    const v = active === 'D1' ? { sign: p.rashi.idx, degree: p.degreeInRashi.decimal } : p.varga[active];
    const bhavaRashi = ((v.sign - lagnaVargaSign + 12) % 12) + 1;
    return { ...p, rashi: { name: SIGN_NAMES[v.sign], idx: v.sign }, degreeInRashi: { decimal: v.degree }, bhavaRashi };
  });

  // Group planets by their varga sign, for the compact house-like list below the diagram.
  const bySign = {};
  for (let i = 0; i < 12; i++) bySign[i] = [];
  vargaPlanets.forEach(p => bySign[p.rashi.idx].push(p));

  return (
    <div>
      <PageHeader title="Divisional Charts (Varga)" subtitle={meta.desc} />
      <div className="flex gap-2 mb-5 flex-wrap">
        {VARGAS.map(v => (
          <button key={v.key} onClick={() => { setActive(v.key); setSelectedHouse(null); }}
            className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${active === v.key ? 'bg-gold/20 border-gold text-laterite font-medium' : 'border-ink/15 text-ink/60'}`}>
            {v.label}
          </button>
        ))}
      </div>

      <Card className="flex flex-col items-center mb-5">
        <div className="flex items-center gap-2 mb-3 self-end">
          <button
            onClick={() => update({ chartStyle: settings.chartStyle === 'north' ? 'south' : 'north' })}
            className="flex items-center gap-1.5 text-xs rounded-full border border-gold/40 px-3 py-1 text-indigo hover:bg-gold/10"
          >
            <LayoutGrid size={13} /> {settings.chartStyle === 'north' ? 'North Indian' : 'South Indian'} style
          </button>
        </div>
        <ChartWheel
          style={settings.chartStyle}
          lagnaRashiIdx={lagnaVargaSign}
          planets={vargaPlanets}
          signNames={SIGN_NAMES}
          selectedHouse={selectedHouse}
          onSelectHouse={h => setSelectedHouse(h === selectedHouse ? null : h)}
          size={340}
        />
        <p className="text-xs text-ink/45 mt-3">Tap/click a house for details · {meta.label} ascendant: {SIGN_NAMES[lagnaVargaSign]}</p>
        <HouseDetailPanel houseNum={selectedHouse} lagnaRashiIdx={lagnaVargaSign} planets={vargaPlanets} signNames={SIGN_NAMES} onClose={() => setSelectedHouse(null)} />
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SIGN_NAMES.map((sign, idx) => (
          <Card key={sign} className={`min-h-[92px] ${bySign[idx].length ? '' : 'opacity-60'}`}>
            <p className="text-xs uppercase tracking-wide text-gold-dark mb-1.5">{idx + 1}. {sign}</p>
            {bySign[idx].length === 0 ? (
              <p className="text-xs text-ink/35">—</p>
            ) : (
              <ul className="space-y-0.5">
                {bySign[idx].map(p => (
                  <li key={p.name} className="text-sm text-ink flex justify-between">
                    <span>{planetCode(p.name)} {p.name}{p.isRetro ? ' (R)' : ''}</span>
                    <span className="text-ink/45">{p.degreeInRashi.decimal.toFixed(1)}°</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

