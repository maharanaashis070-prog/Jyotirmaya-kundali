import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { loadSettings, saveSettings } from '../lib/storage.js';
import { translate } from '../lib/i18n.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSettings());

  const update = useCallback((patch) => {
    setSettings(prev => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const t = useCallback((key) => translate(settings.language, key), [settings.language]);

  const value = useMemo(() => ({ settings, update, t }), [settings, update, t]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
