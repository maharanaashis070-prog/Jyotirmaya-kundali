import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
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
const TYPE_LABEL = { raja: 'Raja Yoga', dhana: 'Dhana Yoga', duryoga: 'Duryoga', nabhasa: 'Nabhasa Yoga' };

export default function YogasPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { yogas } = data;

  return (
    <div>
      <PageHeader title="Yogas" subtitle="Classical planetary combinations detected in this chart." />
      {yogas.length === 0 ? (
        <EmptyState title="No classical yogas detected" subtitle="Not every chart forms one of the tracked combinations — that's an accurate, ordinary result, not an error." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {yogas.map((y, i) => (
            <Card key={`${y.name}-${i}`}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-gold-dark" />
                  <h3 className="font-display text-lg text-indigo">{y.name}</h3>
                </div>
                <Badge tone={STRENGTH_TONE[y.strength] || 'neutral'}>{y.strength}</Badge>
              </div>
              <p className="text-sm text-ink/70 mb-3">{y.desc}</p>
              <div className="flex items-center justify-between text-xs text-ink/45">
                <span>{y.planets.join(' · ')}</span>
                <span className="uppercase tracking-wide">{TYPE_LABEL[y.type] || y.type}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
