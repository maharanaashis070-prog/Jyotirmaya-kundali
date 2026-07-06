import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinOff, Sparkles } from 'lucide-react';
import CitySearch from '../components/onboarding/CitySearch.jsx';
import Card from '../components/common/Card.jsx';
import TempleHero from '../components/common/TempleHero.jsx';
import { useProfiles } from '../context/ProfileContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { ianaZoneFor, offsetHoursFor, offsetLabel } from '../lib/timezone.js';

const todayIso = new Date().toISOString().slice(0, 10);

export default function OnboardingPage() {
  const { addProfile, profiles } = useProfiles();
  const { t } = useSettings();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [relation, setRelation] = useState('self');
  const [dob, setDob] = useState('');
  const [tob, setTob] = useState('12:00');
  const [placeMode, setPlaceMode] = useState('search');
  const [place, setPlace] = useState(null); // {label, lat, lon}
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualLabel, setManualLabel] = useState('');
  const [tzOverride, setTzOverride] = useState('');
  const [error, setError] = useState('');

  const lat = placeMode === 'search' ? place?.lat : parseFloat(manualLat);
  const lon = placeMode === 'search' ? place?.lon : parseFloat(manualLon);
  const placeLabel = placeMode === 'search' ? place?.label : (manualLabel || 'Custom location');

  const [year, month, day] = dob ? dob.split('-').map(Number) : [null, null, null];
  const [hour, minute] = tob ? tob.split(':').map(Number) : [12, 0];

  const ianaZone = useMemo(() => (Number.isFinite(lat) && Number.isFinite(lon)) ? ianaZoneFor(lat, lon) : null, [lat, lon]);

  const autoOffset = useMemo(() => {
    if (!ianaZone || !year) return null;
    return offsetHoursFor(ianaZone, { year, month, day, hour, minute });
  }, [ianaZone, year, month, day, hour, minute]);

  const effectiveOffset = tzOverride !== '' ? parseFloat(tzOverride) : autoOffset;

  useEffect(() => { setTzOverride(''); }, [ianaZone]);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Please enter a name.');
    if (!year || !month || !day) return setError('Please enter a date of birth.');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return setError('Please choose a birthplace or enter latitude/longitude.');
    if (!Number.isFinite(effectiveOffset)) return setError('Could not determine a UTC offset — enter one manually.');

    addProfile({
      name: name.trim(), relation,
      year, month, day, hour, minute,
      lat, lon, tzOffset: effectiveOffset,
      placeLabel, ianaZone,
    });
    navigate('/');
  }

  return (
    <div className="max-w-lg mx-auto">
      <TempleHero className="mb-6">
        <h1 className="font-display text-2xl sm:text-3xl text-ivory drop-shadow">{t('onboarding_title')}</h1>
        <p className="text-sm text-ivory/80 mt-1.5 max-w-sm drop-shadow">{t('onboarding_sub')}</p>
      </TempleHero>
      {profiles.length > 0 && (
        <div className="text-center -mt-3 mb-5">
          <button onClick={() => navigate('/')} className="text-xs text-teal underline underline-offset-2">
            Skip — go back to my chart
          </button>
        </div>
      )}

      <Card as="form" onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1">{t('field_name')}</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ananya Patra"
            className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">{t('field_relation')}</label>
          <div className="flex gap-2 flex-wrap">
            {['self', 'family', 'friend'].map(r => (
              <button key={r} type="button" onClick={() => setRelation(r)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${relation === r ? 'bg-gold/20 border-gold text-laterite font-medium' : 'border-ink/15 text-ink/60'}`}>
                {t(`relation_${r}`)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('field_dob')}</label>
            <input type="date" value={dob} max={todayIso} onChange={e => setDob(e.target.value)}
              className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">{t('field_tob')}</label>
            <input type="time" value={tob} onChange={e => setTob(e.target.value)}
              className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-ink">{t('field_pob')}</label>
            <button type="button" onClick={() => setPlaceMode(m => m === 'search' ? 'manual' : 'search')}
              className="text-xs text-teal underline underline-offset-2 flex items-center gap-1">
              <MapPinOff size={12} /> {placeMode === 'search' ? t('field_manual_entry') : 'Search a city instead'}
            </button>
          </div>
          {placeMode === 'search' ? (
            <CitySearch placeholder={t('field_search_placeholder')} onSelect={setPlace} />
          ) : (
            <div className="space-y-2">
              <input value={manualLabel} onChange={e => setManualLabel(e.target.value)} placeholder="Location name (optional)"
                className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
              <div className="grid grid-cols-2 gap-2">
                <input value={manualLat} onChange={e => setManualLat(e.target.value)} placeholder={t('field_lat') + ' e.g. 20.29'}
                  className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
                <input value={manualLon} onChange={e => setManualLon(e.target.value)} placeholder={t('field_lon') + ' e.g. 85.82'}
                  className="w-full rounded-md border border-ink/15 px-3 py-2.5 text-sm outline-none focus:border-gold" />
              </div>
            </div>
          )}
        </div>

        {Number.isFinite(lat) && Number.isFinite(lon) && (
          <div className="rounded-md bg-indigo/5 border border-indigo/15 px-3 py-2.5 text-sm flex items-center justify-between flex-wrap gap-2">
            <span className="text-ink/70">
              {lat.toFixed(3)}°, {lon.toFixed(3)}° {ianaZone && <span className="text-ink/45">· {ianaZone}</span>}
            </span>
            <label className="flex items-center gap-1.5 text-xs text-ink/60">
              {t('field_tz')}:
              <input
                type="number" step="0.25"
                value={tzOverride !== '' ? tzOverride : (autoOffset ?? '')}
                onChange={e => setTzOverride(e.target.value)}
                className="w-16 rounded border border-ink/15 px-1.5 py-1 text-xs"
              />
              <span className="text-teal">{Number.isFinite(effectiveOffset) ? offsetLabel(effectiveOffset) : ''}</span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-laterite">{error}</p>}

        <button type="submit" className="w-full rounded-md bg-laterite text-ivory font-medium py-2.5 flex items-center justify-center gap-2 hover:bg-laterite-dark transition-colors">
          <Sparkles size={16} /> {t('btn_save')}
        </button>
      </Card>
    </div>
  );
}
