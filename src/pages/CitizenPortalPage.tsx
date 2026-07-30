import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useLiveData } from '@/lib/useLiveData';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { levelFromWater, ALERT_META, type AlertLevel, type LocationRecord } from '@/lib/types';
import {
  Droplets, Shield, MapPin, Phone, Siren, LifeBuoy, Building2, AlertTriangle, CheckCircle2,
} from 'lucide-react';

const SAFETY_INSTRUCTIONS = [
  'Avoid walking or driving through flood waters — even 15cm can sweep you off your feet.',
  'Move to higher ground immediately if water levels rise rapidly.',
  'Keep emergency contacts saved and your phone charged.',
  'Do not touch electrical equipment while standing in water.',
  'Follow official evacuation orders without delay.',
  'Keep a basic emergency kit: water, food, flashlight, first aid.',
];

const EMERGENCY = [
  { name: 'Police', number: '100', icon: Shield },
  { name: 'Fire & Rescue', number: '101', icon: Siren },
  { name: 'Ambulance', number: '108', icon: LifeBuoy },
  { name: 'Disaster Management', number: '1070', icon: AlertTriangle },
];

export function CitizenPortalPage() {
  const { user } = useAuth();
  const { devices, latest, alerts, loading } = useLiveData();
  const { settings } = useAuth();
  const [locations, setLocations] = useState<LocationRecord[]>([]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('locations').select('*').eq('user_id', user.id).order('created_at');
      setLocations((data as LocationRecord[]) ?? []);
    })();
  }, [user]);

  if (loading) return <LoadingSpinner label="Loading citizen portal…" />;

  const readings = devices.map((d) => latest[d.id]).filter(Boolean) as any[];
  const currentLevel = readings[0]?.water_level ?? 0;
  const level: AlertLevel = settings ? levelFromWater(currentLevel, settings) : 'safe';
  const meta = ALERT_META[level];
  const safeZones = locations.filter((l) => l.type === 'safe_zone');
  const reliefCenters = locations.filter((l) => l.type === 'relief_center');
  const activeAlerts = alerts.filter((a) => a.status === 'active');

  return (
    <div className="space-y-6">
      <PageHeader title="Citizen Portal" subtitle="Public-facing flood information and safety guidance" />

      {/* Current flood status */}
      <div className={`glass flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between ${meta.bg}`}>
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${meta.bg} ${meta.color}`}>
            <Droplets className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-white/50">Current Flood Level</p>
            <p className="text-3xl font-bold text-white">{currentLevel.toFixed(1)} cm</p>
          </div>
        </div>
        <div className="text-right">
          <Badge tone={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'}>{meta.label}</Badge>
          <p className="mt-2 text-sm text-white/50">{activeAlerts.length} active alerts</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Safety instructions */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold text-white">Safety Instructions</h3></div>
          <ul className="space-y-3">
            {SAFETY_INSTRUCTIONS.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" /> {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Latest alerts */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><Siren className="h-5 w-5 text-red-300" /><h3 className="font-semibold text-white">Latest Alerts</h3></div>
          {activeAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No active alerts. All areas safe.</p>
          ) : (
            <div className="space-y-2">
              {activeAlerts.slice(0, 5).map((a) => {
                const m = ALERT_META[a.alert_level as AlertLevel];
                return (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${m.color.replace('text-', 'bg-')}`} />
                    <div className="flex-1"><p className="text-sm font-medium text-white">{a.node_id}</p><p className="text-xs text-white/50">{a.message}</p></div>
                    <span className="text-xs text-white/40">{new Date(a.created_at).toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Safe zones */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold text-white">Nearby Safe Zones</h3></div>
          {safeZones.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No safe zones registered.</p>
          ) : (
            <div className="space-y-2">
              {safeZones.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                  <MapPin className="h-4 w-4 text-emerald-300" />
                  <div className="flex-1"><p className="text-sm font-medium text-white">{l.name}</p><p className="text-xs text-white/40">{l.address || `${l.latitude.toFixed(3)}, ${l.longitude.toFixed(3)}`}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Relief centers */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><Building2 className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Nearby Relief Centers</h3></div>
          {reliefCenters.length === 0 ? (
            <p className="py-6 text-center text-sm text-white/40">No relief centers registered.</p>
          ) : (
            <div className="space-y-2">
              {reliefCenters.map((l) => (
                <div key={l.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                  <Building2 className="h-4 w-4 text-aqua-300" />
                  <div className="flex-1"><p className="text-sm font-medium text-white">{l.name}</p><p className="text-xs text-white/40">{l.address || `${l.latitude.toFixed(3)}, ${l.longitude.toFixed(3)}`}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency contacts */}
      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2"><Phone className="h-5 w-5 text-red-300" /><h3 className="font-semibold text-white">Emergency Contacts</h3></div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EMERGENCY.map((e) => (
            <div key={e.name} className="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
              <e.icon className="h-5 w-5 text-red-300" />
              <div><p className="text-sm font-medium text-white">{e.name}</p><p className="text-lg font-bold text-red-300">{e.number}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
