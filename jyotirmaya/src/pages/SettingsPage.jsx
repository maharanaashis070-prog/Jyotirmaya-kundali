import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Wifi, WifiOff } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader.jsx';
import Card from '../components/common/Card.jsx';
import SectionDivider from '../components/common/SectionDivider.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { LANGUAGES } from '../lib/i18n.js';
import { checkTrackBHealth } from '../lib/trackB.js';
import WarliBorder from '../components/common/WarliBorder.jsx';

export default function SettingsPage() {
  const { settings, update, t } = useSettings();
  const { profiles, activeProfile, selectProfile, removeProfile } = useProfiles();
  const navigate = useNavigate();
  const [healthState, setHealthState] = useState(null); // 'checking' | 'ok' | 'fail'

  async function testTrackB() {
    setHealthState('checking');
    const r = await checkTrackBHealth(settings.trackBUrl);
    setHealthState(r.ok ? 'ok' : 'fail');
  }

  return (
    <div>
      <PageHeader title={t('nav_settings')} subtitle="Everything below is stored only on this device." />

      <Card>
        <h3 className="font-display text-indigo mb-3">{t('settings_language')}</h3>
        <div className="flex gap-2 flex-wrap">
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => update({ language: l.code })}
              className={`px-3.5 py-1.5 rounded-full text-sm border transition-colors ${settings.language === l.code ? 'bg-gold/20 border-gold text-laterite font-medium' : 'border-ink/15 text-ink/60'}`}>
              {l.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink/45 mt-3">{t('settings_i18n_note')}</p>
      </Card>

      <SectionDivider />

      <Card>
        <h3 className="font-display text-indigo mb-3">{t('settings_chart_style')}</h3>
        <div className="flex gap-2">
          {['north', 'south'].map(s => (
            <button key={s} onClick={() => update({ chartStyle: s })}
              className={`px-3.5 py-1.5 rounded-full text-sm border capitalize transition-colors ${settings.chartStyle === s ? 'bg-gold/20 border-gold text-laterite font-medium' : 'border-ink/15 text-ink/60'}`}>
              {s} Indian
            </button>
          ))}
        </div>
      </Card>

      <SectionDivider />

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-indigo">{t('precision_mode')}</h3>
            <p className="text-xs text-ink/50 mt-0.5">{t('precision_sub')}</p>
          </div>
          <button
            onClick={() => update({ precisionMode: !settings.precisionMode })}
            className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${settings.precisionMode ? 'bg-teal' : 'bg-ink/20'}`}
          >
            <span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${settings.precisionMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="text-xs text-ink/50 mt-3">
          Improves the Life-Area Probability scores using a Swiss-Ephemeris backend you run yourself. Kundli, Dasha, Yogas, and Transits
          always use the free, in-browser Track A engine — Track A doesn't compute Vimshottari Dasha in Track B's format, so dasha is never sourced from it.
        </p>
        {settings.precisionMode && (
          <div className="mt-3 space-y-2">
            <label className="text-xs text-ink/55 block">Backend URL</label>
            <div className="flex gap-2">
              <input value={settings.trackBUrl} onChange={e => update({ trackBUrl: e.target.value })}
                className="flex-1 rounded-md border border-ink/15 px-3 py-2 text-sm outline-none focus:border-gold" />
              <button onClick={testTrackB} className="rounded-md border border-ink/15 px-3 py-2 text-sm flex items-center gap-1.5 hover:bg-ink/5">
                {healthState === 'checking' ? '…' : healthState === 'ok' ? <Wifi size={14} className="text-teal" /> : healthState === 'fail' ? <WifiOff size={14} className="text-laterite" /> : null}
                Test
              </button>
            </div>
            <p className="text-xs text-ink/40">
              Run it locally: <code className="bg-ink/5 px-1 rounded">cd server/astro-python-backend &amp;&amp; pip install flask flask-cors pyswisseph --break-system-packages &amp;&amp; python app.py</code>
            </p>
          </div>
        )}
      </Card>

      <SectionDivider />

      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-indigo">{t('settings_profiles')}</h3>
          <button onClick={() => navigate('/onboarding')} className="flex items-center gap-1.5 text-xs text-teal underline underline-offset-2">
            <Plus size={13} /> {t('btn_add_profile')}
          </button>
        </div>
        <ul className="divide-y divide-ink/5">
          {profiles.map(p => (
            <li key={p.id} className="flex items-center justify-between py-2.5">
              <div>
                <button onClick={() => selectProfile(p.id)} className={`text-sm text-left ${p.id === activeProfile?.id ? 'text-laterite font-medium' : 'text-ink'}`}>
                  {p.name}
                </button>
                <p className="text-xs text-ink/45">{p.placeLabel} · {p.day}/{p.month}/{p.year}</p>
              </div>
              <button onClick={() => removeProfile(p.id)} aria-label="Delete profile" className="p-1.5 text-ink/35 hover:text-laterite">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
          {profiles.length === 0 && <p className="text-sm text-ink/50 py-2">{t('empty_no_profile')}</p>}
        </ul>
      </Card>

      <SectionDivider />

      <Card>
        <h3 className="font-display text-indigo mb-2">{t('settings_data')}</h3>
        <p className="text-sm text-ink/60">{t('settings_privacy_note')}</p>
      </Card>

      <SectionDivider />

      <Card>
        <h3 className="font-display text-indigo mb-2">About the Developer</h3>
        <p className="text-sm text-ink/70 leading-relaxed">
          Hi, I'm <span className="font-medium text-ink">Ashis Maharana</span>, a B.Pharm student at the College of Pharmaceutical
          Sciences, Berhampur and an enthusiastic learner of Vedic astrology and technology.
        </p>
        <p className="text-sm text-ink/70 leading-relaxed mt-2">
          Jyotirmaya is a personal side project built from my interest in combining ancient astrological knowledge with modern
          web development. My goal is to create a simple, accurate, and beautiful platform for exploring Vedic astrology.
        </p>
        <p className="text-sm text-ink/70 leading-relaxed mt-2">Thank you for using Jyotirmaya.</p>
      </Card>
      <WarliBorder className="mt-4 opacity-70" repeats={2} />
    </div>
  );
}
