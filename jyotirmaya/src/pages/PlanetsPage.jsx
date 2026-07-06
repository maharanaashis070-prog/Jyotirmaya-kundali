import { Link } from 'react-router-dom';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import PlanetBadge from '../components/chart/PlanetBadge.jsx';
import NavagrahaFrieze from '../components/common/NavagrahaFrieze.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

const DIGNITY_TONE = { 'Exalted': 'gold', 'Own House': 'teal', 'Debilitated': 'laterite', 'Neecha Bhanga': 'gold', 'Neutral': 'neutral' };

export default function PlanetsPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { structured, shadbala } = data;

  return (
    <div>
      <PageHeader title="Planets & Positions" subtitle="Sign, degree, nakshatra, house, retrograde, combustion, and dignity for every graha." />
      <Card className="mb-5">
        <NavagrahaFrieze />
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {structured.planets.map(p => {
          const sb = shadbala[p.name] || {};
          return (
            <Card key={p.name}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <PlanetBadge name={p.name} size={38} />
                  <h3 className="font-display text-lg text-indigo">{p.name}</h3>
                </div>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {p.isRetro && <Badge tone="laterite">Retrograde</Badge>}
                  {sb.combust && <Badge tone="warn">Combust</Badge>}
                  {sb.dignity && sb.dignity !== 'Neutral' && (
                    <Badge tone={DIGNITY_TONE[sb.dignity]} title={sb.dignity === 'Neecha Bhanga' ? 'Debilitated, but the sign lord sits in a Kendra from Lagna or Moon — a classical condition that cancels the debilitation.' : undefined}>
                      {sb.dignity}
                    </Badge>
                  )}
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
                <dt className="text-ink/50">Sign</dt><dd className="text-ink">{p.rashi.name} {p.degreeInRashi.decimal.toFixed(2)}°</dd>
                <dt className="text-ink/50">House</dt><dd className="text-ink">{p.bhavaRashi}{p.shifted ? ` (chalit ${p.bhavaChalit})` : ''}</dd>
                <dt className="text-ink/50">Nakshatra</dt><dd className="text-ink">{p.nakshatra} · pada {p.pada}</dd>
                <dt className="text-ink/50">Nakshatra lord</dt><dd className="text-ink">{p.nakshatraLord}</dd>
                <dt className="text-ink/50">Sign lord</dt><dd className="text-ink">{p.signLord}</dd>
                {sb.total != null && (<><dt className="text-ink/50">Shadbala</dt><dd className="text-ink">{sb.pct}%</dd></>)}
              </dl>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
