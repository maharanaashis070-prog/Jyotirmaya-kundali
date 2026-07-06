import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const STRENGTH_TONE = { strong: 'gold', moderate: 'teal', weak: 'neutral' };

export default function TransitsPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const transits = [...data.transits].sort((a, b) => a.day - b.day);

  return (
    <div>
      <PageHeader title="Transit Predictions" subtitle="Dated Jupiter / Saturn / Mars / Venus transits to natal points over the next ~2 years, from mean planetary motion." />
      {transits.length === 0 ? (
        <EmptyState title="No notable transits found" subtitle="Nothing in the tracked transit-to-natal pairs crosses in the scanned window." />
      ) : (
        <div className="relative pl-5 border-l-2 border-gold/30 space-y-5">
          {transits.map((tr, i) => (
            <div key={i} className="relative">
              <span className="absolute -left-[1.65rem] top-1.5 w-2.5 h-2.5 rounded-full bg-gold" />
              <Card>
                <div className="flex items-start justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={15} className="text-teal" />
                    <h3 className="font-display text-base text-indigo">{tr.transitPlanet} {tr.aspectName} natal {tr.natalPlanet}</h3>
                  </div>
                  <Badge tone={STRENGTH_TONE[tr.strength] || 'neutral'}>{tr.strength}</Badge>
                </div>
                <p className="text-sm text-ink/70 mb-2">{tr.meaning}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink/45">
                  <span>{tr.dateStr}</span>
                  <span>Transit sign: {tr.transitSign}</span>
                  <span>Dasha: {tr.dashaLabel}</span>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
