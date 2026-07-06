import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  loadProfiles, upsertProfile, deleteProfile as deleteProfileFromStore,
  getActiveProfileId, setActiveProfileId, makeProfileId,
} from '../lib/storage.js';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const [profiles, setProfiles] = useState(() => loadProfiles());
  const [activeId, setActiveId] = useState(() => getActiveProfileId());

  useEffect(() => {
    // If the previously-active profile was removed elsewhere, fall back sanely.
    if (activeId && !profiles.find(p => p.id === activeId)) {
      const fallback = profiles[0]?.id || null;
      setActiveId(fallback);
      if (fallback) setActiveProfileId(fallback);
    }
  }, [profiles, activeId]);

  const addProfile = useCallback((data) => {
    const id = makeProfileId();
    const profile = { id, createdAt: Date.now(), ...data };
    setProfiles(upsertProfile(profile));
    setActiveId(id);
    setActiveProfileId(id);
    return profile;
  }, []);

  const updateProfile = useCallback((id, patch) => {
    setProfiles(prev => {
      const existing = prev.find(p => p.id === id);
      if (!existing) return prev;
      const updated = { ...existing, ...patch };
      return upsertProfile(updated);
    });
  }, []);

  const removeProfile = useCallback((id) => {
    setProfiles(deleteProfileFromStore(id));
  }, []);

  const selectProfile = useCallback((id) => {
    setActiveId(id);
    setActiveProfileId(id);
  }, []);

  const activeProfile = useMemo(() => profiles.find(p => p.id === activeId) || null, [profiles, activeId]);

  const value = useMemo(() => ({
    profiles, activeProfile, activeId,
    addProfile, updateProfile, removeProfile, selectProfile,
  }), [profiles, activeProfile, activeId, addProfile, updateProfile, removeProfile, selectProfile]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfiles must be used within ProfileProvider');
  return ctx;
}
