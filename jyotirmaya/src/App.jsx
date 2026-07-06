import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import OnboardingPage from './pages/OnboardingPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PlanetsPage from './pages/PlanetsPage.jsx';
import VargaPage from './pages/VargaPage.jsx';
import ShadbalaPage from './pages/ShadbalaPage.jsx';
import DashaPage from './pages/DashaPage.jsx';
import YogasPage from './pages/YogasPage.jsx';
import TransitsPage from './pages/TransitsPage.jsx';
import ProbabilitiesPage from './pages/ProbabilitiesPage.jsx';
import GuidancePage from './pages/GuidancePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ProfileProvider, useProfiles } from './context/ProfileContext.jsx';
import { ChartProvider } from './context/ChartContext.jsx';

function RequireProfile({ children }) {
  const { activeProfile } = useProfiles();
  if (!activeProfile) return <Navigate to="/onboarding" replace />;
  return children;
}

function Routed() {
  return (
    <AppShell>
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/" element={<DashboardPage />} />
        <Route path="/planets" element={<RequireProfile><PlanetsPage /></RequireProfile>} />
        <Route path="/varga" element={<RequireProfile><VargaPage /></RequireProfile>} />
        <Route path="/shadbala" element={<RequireProfile><ShadbalaPage /></RequireProfile>} />
        <Route path="/dasha" element={<RequireProfile><DashaPage /></RequireProfile>} />
        <Route path="/yogas" element={<RequireProfile><YogasPage /></RequireProfile>} />
        <Route path="/transits" element={<RequireProfile><TransitsPage /></RequireProfile>} />
        <Route path="/probabilities" element={<RequireProfile><ProbabilitiesPage /></RequireProfile>} />
        <Route path="/guidance" element={<RequireProfile><GuidancePage /></RequireProfile>} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <ProfileProvider>
        <ChartProvider>
          <HashRouter>
            <Routed />
          </HashRouter>
        </ChartProvider>
      </ProfileProvider>
    </SettingsProvider>
  );
}
