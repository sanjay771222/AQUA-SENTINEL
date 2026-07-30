import {
  Droplets, CloudRain, Thermometer, Gauge, Battery, Signal, Heart,
  Cpu, Wifi, WifiOff, AlertTriangle, Siren, Activity,
} from 'lucide-react';
import { useLiveData } from '@/lib/useLiveData';
import { useAuth } from '@/lib/auth';
import { StatCard, PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { ALERT_META, levelFromWater } from '@/lib/types';

export function DashboardPage() {
  const { devices, latest, alerts, loading } = useLiveData();
  const { settings } = useAuth();

  if (loading) return <LoadingSpinner label="Loading live data…" />;

  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const activeAlerts = alerts.filter((a) => a.status === 'active');

  const readings = devices.map((d) => latest[d.id]).filter(Boolean) as any[];
  const avg = (key: string) => readings.length ? (readings.reduce((s, r) => s + (r[key] ?? 0), 0) / readings.length) : 0;
  const lastReading = readings[0];

  const currentLevel = lastReading?.water_level ?? 0;
  const level = settings ? levelFromWater(currentLevel, settings) : 'safe';
  const meta = ALERT_META[level];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of all sensor nodes — auto-refreshing via Supabase Realtime"
        action={<Badge tone={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'}>● Live</Badge>}
      />

      {devices.length === 0 ? (
        <EmptyState icon={Cpu} title="No devices yet" message="Add ESP32 sensor nodes in Device Management to start monitoring." />
      ) : (
        <>
          {/* Alert banner */}
          {activeAlerts.length > 0 && (
            <div className={`glass flex items-center gap-3 p-4 ${meta.bg}`}>
              <Siren className={`h-5 w-5 ${meta.color}`} />
              <div className="flex-1">
                <p className="font-semibold text-white">{activeAlerts.length} active alert{activeAlerts.length > 1 ? 's' : ''}</p>
                <p className="text-sm text-white/60">Latest: {activeAlerts[0]?.message}</p>
              </div>
              <Badge tone={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'}>
                {meta.label}
              </Badge>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <StatCard icon={Droplets} label="Current Water Level" value={currentLevel.toFixed(1)} unit="cm" accent={level === 'safe' ? 'aqua' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'} sub={`Alert: ${meta.label}`} />
            <StatCard icon={CloudRain} label="Rain Status" value={lastReading?.rain_detected ? 'Detected' : 'Clear'} accent={lastReading?.rain_detected ? 'aqua' : 'emerald'} />
            <StatCard icon={Thermometer} label="Temperature" value={avg('temperature').toFixed(1)} unit="°C" accent="orange" />
            <StatCard icon={Gauge} label="Humidity" value={avg('humidity').toFixed(0)} unit="%" accent="aqua" />
            <StatCard icon={Battery} label="Avg Battery" value={avg('battery').toFixed(0)} unit="%" accent="emerald" />
            <StatCard icon={Signal} label="Avg Signal" value={avg('signal_strength').toFixed(0)} unit="%" accent="navy" />
            <StatCard icon={Heart} label="Device Health" value={`${Math.round((online / devices.length) * 100)}%`} accent="emerald" />
            <StatCard icon={Cpu} label="Total Sensor Nodes" value={devices.length} accent="aqua" />
            <StatCard icon={Wifi} label="Online Devices" value={online} accent="emerald" />
            <StatCard icon={WifiOff} label="Offline Devices" value={offline} accent="red" />
            <StatCard icon={AlertTriangle} label="Current Alert Level" value={meta.label} accent={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'} />
            <StatCard icon={Siren} label="Active Alerts" value={activeAlerts.length} accent={activeAlerts.length > 0 ? 'red' : 'emerald'} />
          </div>

          {/* Recent alerts */}
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-aqua-300" />
              <h3 className="font-semibold text-white">Recent Alerts</h3>
            </div>
            {alerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-white/40">No alerts recorded.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 6).map((a) => {
                  const m = ALERT_META[a.alert_level];
                  return (
                    <div key={a.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${m.color.replace('text-', 'bg-')}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{a.node_id}</p>
                          <p className="text-xs text-white/50">{a.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone={a.status === 'active' ? 'red' : a.status === 'acknowledged' ? 'yellow' : 'emerald'}>{a.status}</Badge>
                        <span className="text-xs text-white/40">{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
