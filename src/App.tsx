import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Layout, type PageKey } from '@/components/Layout';
import { AuthPage } from '@/components/AuthPage';
import { LoadingSpinner } from '@/components/ui';
import { HomePage } from '@/pages/HomePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FloodMapPage } from '@/pages/FloodMapPage';
import { MonitoringPage } from '@/pages/MonitoringPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { WeatherPage } from '@/pages/WeatherPage';
import { DevicesPage } from '@/pages/DevicesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { CitizenPortalPage } from '@/pages/CitizenPortalPage';
import { ApiSettingsPage } from '@/pages/ApiSettingsPage';
import { UsersPage } from '@/pages/UsersPage';
import { SystemSettingsPage } from '@/pages/SystemSettingsPage';
import { ProfilePage } from '@/pages/ProfilePage';

function Shell() {
  const { user, settings, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('home');
  const [dark, setDark] = useState(true);

  useEffect(() => {
    if (settings) {
      setDark(settings.dark_mode);
      document.documentElement.classList.toggle('light', !settings.dark_mode);
    }
  }, [settings]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-950">
        <LoadingSpinner label="Initializing AquaSentinel…" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('light', !next);
  };

  const render = () => {
    switch (page) {
      case 'home': return <HomePage onNavigate={setPage} />;
      case 'dashboard': return <DashboardPage />;
      case 'map': return <FloodMapPage />;
      case 'monitoring': return <MonitoringPage />;
      case 'analytics': return <AnalyticsPage />;
      case 'alerts': return <AlertsPage />;
      case 'weather': return <WeatherPage />;
      case 'devices': return <DevicesPage />;
      case 'notifications': return <NotificationsPage />;
      case 'reports': return <ReportsPage />;
      case 'citizen': return <CitizenPortalPage />;
      case 'api': return <ApiSettingsPage />;
      case 'users': return <UsersPage />;
      case 'system': return <SystemSettingsPage />;
      case 'profile': return <ProfilePage />;
      default: return <HomePage onNavigate={setPage} />;
    }
  };

  return (
    <Layout page={page} onNavigate={setPage} dark={dark} onToggleDark={toggleDark}>
      {render()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
