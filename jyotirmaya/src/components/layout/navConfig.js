import {
  LayoutGrid, Orbit, Grid3x3, Gauge, Clock, Sparkles,
  TrendingUp, Moon, Compass, Settings as SettingsIcon,
} from 'lucide-react';

export const NAV_ITEMS = [
  { path: '/', key: 'nav_dashboard', icon: LayoutGrid },
  { path: '/planets', key: 'nav_planets', icon: Orbit },
  { path: '/varga', key: 'nav_varga', icon: Grid3x3 },
  { path: '/shadbala', key: 'nav_shadbala', icon: Gauge },
  { path: '/dasha', key: 'nav_dasha', icon: Clock },
  { path: '/yogas', key: 'nav_yogas', icon: Sparkles },
  { path: '/transits', key: 'nav_transits', icon: TrendingUp },
  { path: '/probabilities', key: 'nav_probabilities', icon: Compass },
  { path: '/guidance', key: 'nav_guidance', icon: Moon },
  { path: '/settings', key: 'nav_settings', icon: SettingsIcon },
];

export const MOBILE_PRIMARY_PATHS = ['/', '/planets', '/dasha', '/guidance'];
