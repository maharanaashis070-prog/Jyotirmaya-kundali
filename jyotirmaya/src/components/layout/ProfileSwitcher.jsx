import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProfiles } from '../../context/ProfileContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';

export default function ProfileSwitcher() {
  const { profiles, activeProfile, selectProfile } = useProfiles();
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!activeProfile) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 rounded-full border border-gold/40 bg-white/60 px-3 py-1.5 text-sm font-medium text-indigo hover:bg-white/90 transition-colors"
      >
        {activeProfile.relation === 'self' ? <User size={15} /> : <Users size={15} />}
        <span className="max-w-[9rem] truncate">{activeProfile.name}</span>
        <ChevronDown size={15} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-lg border border-gold/30 bg-ivory shadow-temple z-30 py-1.5 overflow-hidden">
          <p className="px-3 pt-1 pb-2 text-xs uppercase tracking-wide text-ink/40">{t('settings_profiles')}</p>
          <ul className="max-h-64 overflow-y-auto">
            {profiles.map(p => (
              <li key={p.id}>
                <button
                  onClick={() => { selectProfile(p.id); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gold/10 flex items-center justify-between ${p.id === activeProfile.id ? 'text-laterite font-medium' : 'text-ink'}`}
                >
                  <span className="truncate">{p.name}</span>
                  <span className="text-xs text-ink/40 capitalize">{p.relation}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-ink/10 mt-1 pt-1">
            <button
              onClick={() => { setOpen(false); navigate('/onboarding'); }}
              className="w-full text-left px-3 py-2 text-sm text-teal hover:bg-teal/10 flex items-center gap-2"
            >
              <Plus size={15} /> {t('btn_add_profile')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
