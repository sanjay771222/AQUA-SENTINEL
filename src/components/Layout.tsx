import { useState } from 'react';
import {
  Home, LayoutDashboard, Map, Radio, BarChart3, Siren, CloudRain,
  Cpu, Bell, FileText, Users, KeyRound, UserCog, Settings, User,
  Menu, X, LogOut, Moon, Sun, Bell as BellIcon, Droplets,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useClock, formatTime, formatDate } from '@/lib/useClock';

export type PageKey =
  | 'home' | 'dashboard' | 'map' | 'monitoring' | 'analytics' | 'alerts'
  | 'weather' | 'devices' | 'notifications' | 'reports' | 'citizen'
  | 'api' | 'users' | 'system' | 'profile';

const NAV: { key: PageKey; label: string; icon: typeof Home }[] = [
  { key: 'home', label: 'Home', icon: Home },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'map', label: 'Live Flood Map', icon: Map },
  { key: 'monitoring', label: 'Live Monitoring', icon: Radio },
  { key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { key: 'alerts', label: 'Alerts', icon: Siren },
  { key: 'weather', label: 'Weather', icon: CloudRain },
  { key: 'devices', label: 'Device Management', icon: Cpu },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'citizen', label: 'Citizen Portal', icon: Users },
  { key: 'api', label: 'API Settings', icon: KeyRound },
  { key: 'users', label: 'User Management', icon: UserCog },
  { key: 'system', label: 'System Settings', icon: Settings },
  { key: 'profile', label: 'Profile', icon: User },
];

export function Layout({
  page, onNavigate, dark, onToggleDark, children,
}: {
  page: PageKey;
  onNavigate: (p: PageKey) => void;
  dark: boolean;
  onToggleDark: () => void;
  children: React.ReactNode;
}) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const clock = useClock();
  const initials = (profile?.full_name || profile?.email || 'U').slice(0, 2).toUpperCase();

  const SidebarContent = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-aqua-400 to-aqua-600 shadow-lg shadow-aqua-500/30">
          <Droplets className="h-6 w-6 text-navy-950" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">AquaSentinel</p>
          <p className="text-[10px] uppercase tracking-wider text-aqua-300/70">Flood Early Warning</p>
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {NAV.map((item) => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-aqua-500/15 text-aqua-200 ring-1 ring-inset ring-aqua-500/30'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`h-4 w-4 ${active ? 'text-aqua-300' : 'text-white/50 group-hover:text-white/80'}`} />
              {item.label}
            </button>
          );
        })}
      </div>
      <div className="border-t border-white/5 p-3">
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </nav>
  );

  return (
    <div className={`min-h-screen ${dark ? '' : 'light'}`}>
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 bg-navy-950/80 backdrop-blur-xl lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-white/10 bg-navy-950 animate-slide-up">
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-4 text-white/60 hover:text-white">
              <X className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top nav */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-navy-950/70 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden">
                <Menu className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <Droplets className="h-5 w-5 text-aqua-400" />
                <span className="font-bold text-white">AquaSentinel</span>
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold text-white">{NAV.find((n) => n.key === page)?.label ?? 'AquaSentinel'}</p>
                <p className="text-xs text-white/40">{formatDate(clock)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 sm:flex">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-sm font-medium tabular-nums text-white/80">{formatTime(clock)}</span>
              </div>
              <button onClick={onToggleDark} className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => onNavigate('notifications')} className="relative rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 transition hover:bg-white/10">
                <BellIcon className="h-4 w-4" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400 ring-2 ring-navy-950" />
              </button>
              <button onClick={() => onNavigate('profile')} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5 transition hover:bg-white/10">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-aqua-400 to-aqua-600 text-xs font-bold text-navy-950">
                  {initials}
                </div>
                <span className="hidden text-sm font-medium text-white/80 sm:block">{profile?.full_name || 'User'}</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
