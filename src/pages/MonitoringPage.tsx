import { Droplets, CloudRain, Thermometer, Gauge, Battery, Signal, Cpu, Clock } from 'lucide-react';
import { useLiveData } from '@/lib/useLiveData';
import { StatCard, PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { levelFromWater, ALERT_META } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { useEffect, useState } from 'react';

export function MonitoringPage() {
  const { devices, latest, loading, refresh } = useLiveData();
  const { settings } = useAuth();
  const [, setTick] = useState(0);

  // Auto-refresh every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <LoadingSpinner label="Streaming live data…" />;

  const onlineDevices = devices.filter((d) => d.status !== 'disabled');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Monitoring"
        subtitle="Real-time sensor readings — auto-refreshing every second"
        action={<Badge tone="emerald">● Streaming</Badge>}
      />

      {onlineDevices.length === 0 ? (
        <EmptyState icon={Cpu} title="No live nodes" message="Add and enable devices to see live readings." />
      ) : (
        <div className="space-y-6">
          {onlineDevices.map((d) => {
            const r = latest[d.id];
            const level = settings && r ? levelFromWater(r.water_level, settings) : 'safe';
            const meta = ALERT_META[level];
            const ago = r ? Math.round((Date.now() - new Date(r.timestamp).getTime()) / 1000) : null;
            return (
              <div key={d.id} className="glass p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqua-500/10 text-aqua-300">
                      <Cpu className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{d.name}</p>
                      <p className="text-xs text-white/50">{d.node_id} · {d.location_name || 'No location'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'}>
                      {meta.label}
                    </Badge>
                    <Badge tone={d.status === 'online' ? 'emerald' : 'gray'}>
                      {d.status === 'online' ? '● Online' : '● Offline'}
                    </Badge>
                  </div>
                </div>

                {r ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard icon={Droplets} label="Water Level" value={r.water_level.toFixed(1)} unit="cm" accent={level === 'safe' ? 'aqua' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'} />
                    <StatCard icon={CloudRain} label="Rain Sensor" value={r.rain_detected ? 'Detected' : 'Clear'} accent={r.rain_detected ? 'aqua' : 'emerald'} />
                    <StatCard icon={Thermometer} label="Temperature" value={r.temperature.toFixed(1)} unit="°C" accent="orange" />
                    <StatCard icon={Gauge} label="Humidity" value={r.humidity.toFixed(0)} unit="%" accent="aqua" />
                    <StatCard icon={Battery} label="Battery" value={r.battery.toFixed(0)} unit="%" accent={r.battery < 20 ? 'red' : 'emerald'} />
                    <StatCard icon={Signal} label="WiFi Signal" value={r.signal_strength.toFixed(0)} unit="%" accent="navy" />
                    <StatCard icon={Cpu} label="Node Status" value={d.status === 'online' ? 'Active' : 'Inactive'} accent={d.status === 'online' ? 'emerald' : 'red'} />
                    <StatCard icon={Clock} label="Last Sync" value={ago !== null ? `${ago}s ago` : '—'} accent="navy" />
                  </div>
                ) : (
                  <p className="py-6 text-center text-sm text-white/40">No readings yet for this node.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={() => refresh()} className="btn-ghost mx-auto block">Refresh now</button>
    </div>
  );
}
