import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const BREAKDOWN_META = [
  { key: 's', label: 'Sthana', max: 60, title: 'Positional strength — sign, exaltation, own-house standing.' },
  { key: 'd', label: 'Dig', max: 60, title: 'Directional strength — the house a planet occupies.' },
  { key: 'k', label: 'Kala', max: 60, title: 'Temporal strength — day/night birth timing.' },
  { key: 'c', label: 'Cheshta', max: 60, title: 'Motional strength — retrograde motion adds strength.' },
  { key: 'dr', label: 'Drik', max: 30, title: 'Aspectual strength — benefic/malefic aspects received.' },
  { key: 'n', label: 'Naisargika', max: 60, title: 'Natural strength — a fixed, innate rank per planet.' },
];

function Bar({ value, max, color = 'var(--color-gold)' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function ShadbalaPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { shadbala, isDay } = data;
  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

  return (
    <div>
      <PageHeader
        title="Shadbala — Six-Fold Strength"
        subtitle={`Classical planetary strength scoring. This chart is a ${isDay ? 'day' : 'night'} birth (used for Kala Bala).`}
      />
      <div className="space-y-4">
        {order.map(name => {
          const sb = shadbala[name];
          if (!sb) return null;
          return (
            <Card key={name}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg text-indigo">{name}</h3>
                <div className="flex items-center gap-2">
                  {sb.combust && <Badge tone="warn">Combust</Badge>}
                  {sb.dignity !== 'Neutral' && <Badge tone={sb.dignity === 'Debilitated' ? 'laterite' : 'gold'}>{sb.dignity}</Badge>}
                  <span className="font-display text-xl text-laterite">{sb.pct}%</span>
                </div>
              </div>
              <Bar value={sb.pct} max={100} color="var(--color-laterite)" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 mt-4">
                {BREAKDOWN_META.map(b => (
                  <div key={b.key} title={b.title}>
                    <div className="flex justify-between text-xs text-ink/55 mb-1">
                      <span>{b.label}</span><span>{sb.breakdown[b.key]}/{b.max}</span>
                    </div>
                    <Bar value={sb.breakdown[b.key]} max={b.max} />
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
