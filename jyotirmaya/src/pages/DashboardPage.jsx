import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Sparkles, TrendingUp, RefreshCw, FileText, LayoutGrid } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import SectionDivider from '../components/common/SectionDivider.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import TempleHero from '../components/common/TempleHero.jsx';
import ChartWheel from '../components/chart/ChartWheel.jsx';
import HouseDetailPanel from '../components/chart/HouseDetailPanel.jsx';
import NavagrahaFrieze from '../components/common/NavagrahaFrieze.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { SIGN_NAMES } from '../engines/chart-engine/chartCalculationEngine.js';
import { generateChartSummaryText } from '../lib/adapters.js';

export default function DashboardPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh, trackBNote } = useChart();
  const { settings, update, t } = useSettings();
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  if (!activeProfile) {
    return (
      <EmptyState
        title={t('empty_no_profile')}
        subtitle={t('empty_no_profile_sub')}
        action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>}
      />
    );
  }
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { structured, dashas, yogas, transits } = data;
  const maha = dashas.find(d => d.isCurrent) || dashas[0];
  const antar = maha?.bhuktis?.find(b => b.isCurrent);
  const headlineYoga = [...yogas].sort((a, b) => (a.strength === 'strong' ? -1 : 1) - (b.strength === 'strong' ? -1 : 1))[0];
  const upcomingTransit = [...transits].sort((a, b) => a.day - b.day)[0];

  return (
    <div>
      <TempleHero className="mb-5 h-28 sm:h-36">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-light">{t('appTagline')}</p>
        <h1 className="font-display text-xl sm:text-2xl text-ivory drop-shadow mt-1">{activeProfile.name}'s Kundli</h1>
      </TempleHero>
      <PageHeader
        title=""
        subtitle={`${activeProfile.placeLabel} · ${String(activeProfile.day).padStart(2,'0')}/${String(activeProfile.month).padStart(2,'0')}/${activeProfile.year} ${String(activeProfile.hour).padStart(2,'0')}:${String(activeProfile.minute).padStart(2,'0')}`}
        action={
          <button onClick={refresh} className="p-2 rounded-md hover:bg-ink/5 text-ink/50" title="Recalculate">
            <RefreshCw size={17} />
          </button>
        }
      />

      {trackBNote && (
        <div className={`mb-4 rounded-md border px-3 py-2 text-sm ${trackBNote.level === 'warn' ? 'border-gold/50 bg-gold/10 text-gold-dark' : 'border-teal/40 bg-teal/10 text-teal'}`}>
          {trackBNote.message}
        </div>
      )}

      <Card className="flex flex-col items-center">
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
          lagnaRashiIdx={structured.lagna.rashiIdx}
          planets={structured.planets}
          signNames={SIGN_NAMES}
          selectedHouse={selectedHouse}
          onSelectHouse={h => setSelectedHouse(h === selectedHouse ? null : h)}
          size={340}
        />
        <p className="text-xs text-ink/45 mt-3">Tap/click a house for details · Lagna: {structured.lagna.rashi} {structured.lagna.degree.toFixed(2)}°, {structured.lagna.nakshatra} pada {structured.lagna.pada}</p>
        <HouseDetailPanel houseNum={selectedHouse} lagnaRashiIdx={structured.lagna.rashiIdx} planets={structured.planets} signNames={SIGN_NAMES} onClose={() => setSelectedHouse(null)} />
        <button onClick={() => setShowSummary(s => !s)} className="mt-4 flex items-center gap-1.5 text-xs text-teal underline underline-offset-2">
          <FileText size={13} /> {t('btn_view_full_reading')}
        </button>
        {showSummary && (
          <pre className="mt-3 w-full whitespace-pre-wrap text-xs bg-indigo/5 border border-indigo/15 rounded-md p-3 text-ink/75 max-h-96 overflow-y-auto font-body">
            {generateChartSummaryText(structured, dashas)}
          </pre>
        )}
      </Card>

      <SectionDivider label="At a glance" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link to="/dasha">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 text-indigo mb-2"><Clock size={16} /><span className="text-xs uppercase tracking-wide font-medium">Current Dasha</span></div>
            <p className="font-display text-lg text-ink">{maha?.lord}{antar ? ` / ${antar.lord}` : ''}</p>
            <p className="text-xs text-ink/55 mt-1">{maha?.pct != null ? `${maha.pct.toFixed(1)}% through Mahadasha` : ''}</p>
          </Card>
        </Link>
        <Link to="/yogas">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 text-indigo mb-2"><Sparkles size={16} /><span className="text-xs uppercase tracking-wide font-medium">Headline Yoga</span></div>
            {headlineYoga ? (
              <>
                <p className="font-display text-lg text-ink">{headlineYoga.name}</p>
                <Badge tone={headlineYoga.strength === 'strong' ? 'gold' : 'neutral'} className="mt-1">{headlineYoga.strength}</Badge>
              </>
            ) : <p className="text-sm text-ink/55">No classical yoga detected in this chart.</p>}
          </Card>
        </Link>
        <Link to="/transits">
          <Card className="h-full hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 text-indigo mb-2"><TrendingUp size={16} /><span className="text-xs uppercase tracking-wide font-medium">Nearest Transit</span></div>
            {upcomingTransit ? (
              <>
                <p className="font-display text-lg text-ink">{upcomingTransit.transitPlanet} → {upcomingTransit.natalPlanet}</p>
                <p className="text-xs text-ink/55 mt-1">{upcomingTransit.dateStr} · {upcomingTransit.aspectName}</p>
              </>
            ) : <p className="text-sm text-ink/55">No transit events found in range.</p>}
          </Card>
        </Link>
      </div>

      <SectionDivider label="The Nine Grahas" />
      <Card>
        <NavagrahaFrieze />
      </Card>
    </div>
  );
}
