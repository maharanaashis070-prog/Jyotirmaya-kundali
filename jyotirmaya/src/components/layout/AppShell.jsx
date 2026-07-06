import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import KonarkWheel from '../common/KonarkWheel.jsx';
import ProfileSwitcher from './ProfileSwitcher.jsx';
import { NAV_ITEMS, MOBILE_PRIMARY_PATHS } from './navConfig.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useProfiles } from '../../context/ProfileContext.jsx';

function NavRow({ item, t, onClick }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
          isActive ? 'bg-gold/15 text-laterite font-medium' : 'text-ivory/80 hover:bg-white/10'
        }`
      }
    >
      <Icon size={17} />
      {t(item.key)}
    </NavLink>
  );
}

export default function AppShell({ children }) {
  const { t } = useSettings();
  const { activeProfile } = useProfiles();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const mobileItems = NAV_ITEMS.filter(i => MOBILE_PRIMARY_PATHS.includes(i.path));

  return (
    <div className="min-h-screen flex bg-ivory ikat-texture">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col bg-indigo night-texture text-ivory shrink-0">
        <div className="flex items-center gap-2.5 px-4 py-5">
          <KonarkWheel size={34} color="var(--color-gold)" />
          <div>
            <p className="font-display text-lg leading-none">{t('appName')}</p>
            <p className="text-[11px] text-ivory/50 leading-none mt-1">{t('appTagline')}</p>
          </div>
        </div>
        <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-4">
          {NAV_ITEMS.map(item => <NavRow key={item.path} item={item} t={t} />)}
        </nav>
        {activeProfile && (
          <div className="px-4 py-3 border-t border-white/10 text-xs text-ivory/50">
            100% free · runs in your browser
          </div>
        )}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setDrawerOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-indigo text-ivory p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KonarkWheel size={26} color="var(--color-gold)" />
                <span className="font-display">{t('appName')}</span>
              </div>
              <button onClick={() => setDrawerOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map(item => <NavRow key={item.path} item={item} t={t} onClick={() => setDrawerOpen(false)} />)}
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gold/20 bg-ivory/90 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2 md:hidden">
            <KonarkWheel size={28} color="var(--color-indigo)" />
            <span className="font-display text-indigo">{t('appName')}</span>
          </div>
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-2">
            <ProfileSwitcher />
            <button className="md:hidden p-2 rounded-md hover:bg-ink/5" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <Menu size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-5 pb-24 md:pb-8 max-w-5xl w-full mx-auto">
          {children}
        </main>

        {/* Mobile bottom tab bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-indigo border-t border-gold/30 grid grid-cols-5">
          {mobileItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink key={item.path} to={item.path} className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px]">
                <Icon size={19} color={isActive ? 'var(--color-gold)' : 'rgba(246,239,226,0.65)'} />
                <span style={{ color: isActive ? 'var(--color-gold)' : 'rgba(246,239,226,0.65)' }}>{t(item.key)}</span>
              </NavLink>
            );
          })}
          <button onClick={() => setDrawerOpen(true)} className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] text-ivory/65">
            <Menu size={19} />
            More
          </button>
        </nav>
      </div>
    </div>
  );
}
