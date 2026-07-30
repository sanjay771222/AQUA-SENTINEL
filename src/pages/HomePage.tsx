import {
  Droplets, Radio, Map as MapIcon, CloudRain, Siren, FileText, BarChart3,
  Users, Cpu, ArrowRight, Shield, Activity, Wifi, Cloud, Database,
  Smartphone, Volume2, Building2, Phone, Flame, HeartPulse, Landmark,
} from 'lucide-react';
import type { PageKey } from '@/components/Layout';

const FEATURES = [
  { icon: Radio, title: 'Live Monitoring', desc: 'Real-time sensor data streamed from ESP32 nodes across the city.', page: 'monitoring' as PageKey },
  { icon: MapIcon, title: 'Flood Map', desc: 'Interactive map with color-coded markers for every sensor location.', page: 'map' as PageKey },
  { icon: CloudRain, title: 'Weather Forecast', desc: '7-day forecasts and live conditions integrated from OpenWeather.', page: 'weather' as PageKey },
  { icon: Siren, title: 'Smart Alerts', desc: 'Automatic SMS, voice, and push alerts triggered by water levels.', page: 'alerts' as PageKey },
  { icon: FileText, title: 'Reports', desc: 'Generate and export daily, weekly, monthly, and yearly reports.', page: 'reports' as PageKey },
  { icon: BarChart3, title: 'Analytics', desc: 'Trends for water level, rainfall, battery, and temperature.', page: 'analytics' as PageKey },
  { icon: Users, title: 'Citizen Portal', desc: 'Public view of flood levels, safe zones, and emergency contacts.', page: 'citizen' as PageKey },
  { icon: Cpu, title: 'Device Management', desc: 'Add, edit, restart, and monitor every ESP32 sensor node.', page: 'devices' as PageKey },
];

const PIPELINE = [
  { icon: Cpu, label: 'ESP32 Sensors' },
  { icon: Wifi, label: 'Wi-Fi' },
  { icon: Database, label: 'Supabase Cloud' },
  { icon: Activity, label: 'Realtime Dashboard' },
  { icon: Smartphone, label: 'SMS Alerts' },
  { icon: Volume2, label: 'Voice Alerts' },
  { icon: Users, label: 'Citizens & Authorities' },
];

const EMERGENCY = [
  { icon: Shield, name: 'Police', number: '100', tone: 'from-blue-500/20 to-blue-600/10' },
  { icon: Flame, name: 'Fire & Rescue', number: '101', tone: 'from-red-500/20 to-red-600/10' },
  { icon: Landmark, name: 'Disaster Management', number: '1070', tone: 'from-orange-500/20 to-orange-600/10' },
  { icon: HeartPulse, name: 'Hospitals', number: '108', tone: 'from-emerald-500/20 to-emerald-600/10' },
  { icon: Building2, name: 'Municipality', number: '1913', tone: 'from-aqua-500/20 to-aqua-600/10' },
];

export function HomePage({ onNavigate }: { onNavigate: (p: PageKey) => void }) {
  return (
    <div className="space-y-16 pb-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 px-6 py-16 sm:px-12 sm:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 top-0 h-80 w-80 rounded-full bg-aqua-500/20 blur-3xl" />
          <div className="absolute right-10 bottom-0 h-96 w-96 rounded-full bg-navy-500/30 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aqua-400/10 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-aqua-400 to-aqua-600 shadow-xl shadow-aqua-500/40">
            <Droplets className="h-9 w-9 text-navy-950" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Aqua<span className="text-aqua-400">Sentinel</span>
          </h1>
          <p className="mt-4 text-lg text-white/60 sm:text-xl">
            Street-Level Flood Monitoring & Early Warning System
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => onNavigate('dashboard')} className="btn-primary group">
              View Dashboard <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
            <button onClick={() => onNavigate('map')} className="btn-ghost">
              <MapIcon className="h-4 w-4" /> Live Flood Map
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">System Overview</h2>
          <p className="mt-2 text-white/50">Everything you need to monitor, predict, and respond to flooding.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => onNavigate(f.page)}
              className="glass group p-6 text-left transition hover:scale-[1.03] hover:shadow-aqua-500/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aqua-500/10 text-aqua-300 transition group-hover:bg-aqua-500/20">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/50">{f.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-aqua-300 opacity-0 transition group-hover:opacity-100">
                Open <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">How AquaSentinel Works</h2>
          <p className="mt-2 text-white/50">From sensor to citizen in seconds.</p>
        </div>
        <div className="glass overflow-x-auto p-6">
          <div className="flex min-w-max items-center gap-2">
            {PIPELINE.map((step, i) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-2 px-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-500/10 text-aqua-300 ring-1 ring-inset ring-aqua-500/20">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-medium text-white/70">{step.label}</span>
                </div>
                {i < PIPELINE.length - 1 && <ArrowRight className="h-5 w-5 text-aqua-500/50" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency services */}
      <section>
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-white">Emergency Services</h2>
          <p className="mt-2 text-white/50">Quick access to critical contacts during a flood event.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {EMERGENCY.map((e) => (
            <div key={e.name} className={`glass bg-gradient-to-br ${e.tone} p-6 text-center transition hover:scale-[1.03]`}>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                <e.icon className="h-6 w-6" />
              </div>
              <p className="font-semibold text-white">{e.name}</p>
              <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-bold text-aqua-300">
                <Phone className="h-4 w-4" /> {e.number}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 pt-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-aqua-400" />
            <span className="font-semibold text-white">AquaSentinel</span>
          </div>
          <div className="flex gap-6 text-sm text-white/50">
            <span className="cursor-pointer hover:text-white">About</span>
            <span className="cursor-pointer hover:text-white">Contact</span>
            <span className="cursor-pointer hover:text-white">Privacy</span>
            <span className="cursor-pointer hover:text-white">Emergency Numbers</span>
          </div>
          <p className="text-xs text-white/40">© 2026 AquaSentinel. Smart City Initiative.</p>
        </div>
      </footer>
    </div>
  );
}
