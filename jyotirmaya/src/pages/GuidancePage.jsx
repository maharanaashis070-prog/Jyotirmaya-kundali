import { Link } from 'react-router-dom';
import { Moon, Sparkles } from 'lucide-react';
import EmptyState from '../components/common/EmptyState.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import CosmicOracleCard from '../components/guidance/CosmicOracleCard.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

// This page used to also carry "Guidance & Alerts" (favourable/unfavourable
// alerts), "Per-domain decisions", and "Scored dasha × transit windows" —
// all three have been removed so this page is the Cosmic Oracle, undiluted.
// The underlying data those sections displayed (guidance.decisions/windows/
// alerts) is untouched and still computed — the Oracle below still reads
// from it (see oracleContext.js) — only the standalone display of it here
// is gone.
export default function GuidancePage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  return (
    <div>
      <div className="starfield rounded-lg shadow-temple mb-6 px-5 py-7 sm:px-8 sm:py-9">
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-gold/15 border border-gold/40 flex items-center justify-center">
            <Moon size={22} className="text-gold-light" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-ivory flex items-center gap-2">
              Cosmic Oracle <Sparkles size={16} className="text-gold-light" />
            </h1>
            <p className="text-sm text-ivory/70 max-w-xl mt-1">
              A long, precise reading composed entirely on this device from your own dasha, yogas, transits, and
              life-area scores — no network call, ever.
            </p>
          </div>
        </div>
      </div>

      <CosmicOracleCard data={data} />
    </div>
  );
}
