import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import Badge from '../components/common/Badge.jsx';
import LoadingScreen from '../components/common/LoadingScreen.jsx';
import EmptyState from '../components/common/EmptyState.jsx';
import ErrorBanner from '../components/common/ErrorBanner.jsx';
import { useChart } from '../context/ChartContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

function fmt(d) {
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Row({ label, startDate, endDate, isCurrent, depth, expandable, expanded, onToggle, extra }) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-2 text-left rounded-md px-2.5 py-2 transition-colors ${isCurrent ? 'bg-gold/15' : 'hover:bg-ink/5'}`}
      style={{ paddingLeft: `${depth * 1.15 + 0.6}rem` }}
    >
      {expandable ? (
        <ChevronRight size={14} className={`shrink-0 text-ink/40 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      ) : <span className="w-3.5 shrink-0" />}
      <span className={`text-sm flex-1 ${isCurrent ? 'font-semibold text-laterite' : 'text-ink'}`}>{label}</span>
      {isCurrent && <Badge tone="gold">current</Badge>}
      <span className="text-xs text-ink/45 whitespace-nowrap hidden sm:inline">{fmt(startDate)} – {fmt(endDate)}</span>
      {extra}
    </button>
  );
}

export default function DashaPage() {
  const { activeProfile } = useProfiles();
  const { status, data, error, refresh } = useChart();
  const { t } = useSettings();
  const [openMaha, setOpenMaha] = useState(new Set());
  const [openAntar, setOpenAntar] = useState(new Set());

  useEffect(() => {
    if (status === 'ready' && data) {
      const cur = data.dashas.find(d => d.isCurrent);
      if (cur) {
        setOpenMaha(new Set([cur.lord]));
        const curAntar = cur.bhuktis.find(b => b.isCurrent);
        if (curAntar) setOpenAntar(new Set([`${cur.lord}-${curAntar.lord}`]));
      }
    }
  }, [status, data]);

  if (!activeProfile) return <EmptyState title={t('empty_no_profile')} subtitle={t('empty_no_profile_sub')} action={<Link to="/onboarding" className="mt-2 rounded-md bg-laterite text-ivory px-4 py-2 text-sm font-medium">{t('btn_add_profile')}</Link>} />;
  if (status === 'loading' || status === 'idle') return <LoadingScreen label={t('loading_chart')} />;
  if (status === 'error') return <ErrorBanner message={error} onRetry={refresh} />;

  const { dashas } = data;

  function toggleMaha(lord) {
    setOpenMaha(prev => {
      const n = new Set(prev);
      if (n.has(lord)) n.delete(lord); else n.add(lord);
      return n;
    });
  }
  function toggleAntar(key) {
    setOpenAntar(prev => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key); else n.add(key);
      return n;
    });
  }

  return (
    <div>
      <PageHeader title="Vimshottari Dasha Timeline" subtitle="Mahadasha → Antardasha → Pratyantardasha. The active period is highlighted at every level." />
      <Card pattern={false} className="p-2 sm:p-3">
        {dashas.map(maha => (
          <div key={maha.lord} className="border-b border-ink/5 last:border-0">
            <Row
              label={`${maha.lord} Mahadasha`} startDate={maha.startDate} endDate={maha.endDate}
              isCurrent={maha.isCurrent} depth={0} expandable expanded={openMaha.has(maha.lord)}
              onToggle={() => toggleMaha(maha.lord)}
              extra={maha.isCurrent && <span className="text-xs text-ink/45 ml-2 hidden md:inline">{maha.pct.toFixed(1)}% elapsed · {maha.rem}y left</span>}
            />
            {openMaha.has(maha.lord) && maha.bhuktis.map(antar => {
              const antarKey = `${maha.lord}-${antar.lord}`;
              return (
                <div key={antarKey}>
                  <Row
                    label={`${antar.lord} Antardasha`} startDate={antar.startDate} endDate={antar.endDate}
                    isCurrent={antar.isCurrent} depth={1} expandable expanded={openAntar.has(antarKey)}
                    onToggle={() => toggleAntar(antarKey)}
                  />
                  {openAntar.has(antarKey) && antar.pratyantar.map(praty => (
                    <Row
                      key={`${antarKey}-${praty.lord}`}
                      label={`${praty.lord} Pratyantardasha`} startDate={praty.startDate} endDate={praty.endDate}
                      isCurrent={praty.isCurrent} depth={2} expandable={false} expanded={false} onToggle={() => {}}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </Card>
    </div>
  );
}
