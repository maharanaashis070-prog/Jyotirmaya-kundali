import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import GaugeRing from '../components/common/GaugeRing.jsx';
import SectionDivider from '../components/common/SectionDivider.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const DOMAINS = [
  { key: 'marriage', label: 'Marriage', color: 'var(--color-laterite)' },
  { key: 'career', label: 'Career', color: 'var(--color-indigo)' },
  { key: 'wealth', label: 'Wealth', color: 'var(--color-gold)' },
  { key: 'health', label: 'Health', color: 'var(--color-teal)' },
  { key: 'spirituality', label: 'Spirituality', color: 'var(--color-gold-dark)' },
];

export default function ProbabilitiesPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { predictions, trackB } = data;
  const cancelledPlanets = Object.entries(predictions.yogaCancellations).filter(([, v]) => v).map(([n]) => n);

  return (
    <div>
      <PageHeader
        title="Life-Area Probabilities"
        subtitle={`Composite scores from planet strength, dasha triggers, and aspects.${trackB ? ' Powered by Precision Mode (Track B) planetary positions.' : ''}`}
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {DOMAINS.map(d => {
          const e = predictions[d.key];
          return (
            <Card key={d.key} className="flex flex-col items-center">
              <GaugeRing value={e.probability} color={d.color} label={d.label} sublabel={`House ${e.mainHouse}`} />
              {e.varga && <Badge tone="teal" className="mt-2">Varga-checked</Badge>}
            </Card>
          );
        })}
      </div>

      <SectionDivider label="Jupiter's 7-Year House Journey" />
      <Card>
        <div className="flex flex-wrap gap-3">
          {predictions.timeline.map(pt => (
            <div key={pt.yearOffset} className="flex-1 min-w-[70px] text-center rounded-md bg-indigo/5 border border-indigo/15 py-3">
              <p className="text-xs text-ink/50">Year +{pt.yearOffset}</p>
              <p className="font-display text-xl text-indigo mt-1">H{pt.activeHouse}</p>
            </div>
          ))}
        </div>
      </Card>

      <SectionDivider label="Planet Strength & Yoga Cancellations" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-display text-indigo mb-3">Planet Strengths</h3>
          <ul className="space-y-2">
            {Object.entries(predictions.planetStrengths).map(([name, val]) => (
              <li key={name}>
                <div className="flex justify-between text-xs text-ink/55 mb-1"><span>{name}</span><span>{val}</span></div>
                <div className="h-1.5 rounded-full bg-ink/8 overflow-hidden">
                  <div className="h-full rounded-full bg-gold" style={{ width: `${val}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-indigo mb-3">Yoga Cancellations (Bādhaka)</h3>
          {cancelledPlanets.length === 0 ? (
            <p className="text-sm text-ink/55">No cancellation conditions (combust + retrograde, or dusthana placement) detected.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {cancelledPlanets.map(n => <Badge key={n} tone="laterite">{n}</Badge>)}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
