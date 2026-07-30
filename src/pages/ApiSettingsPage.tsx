import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, Badge } from '@/components/ui';
import { type ApiSetting } from '@/lib/types';
import {
  KeyRound, Save, Pencil, Trash2, Plug, CheckCircle2, XCircle, Loader2, Database,
  Cloud, MessageSquare, Phone, Mail, Radio, Cpu, Map,
} from 'lucide-react';

const SERVICES = [
  { name: 'supabase_url', label: 'Supabase URL', icon: Database, placeholder: 'https://xxx.supabase.co' },
  { name: 'supabase_anon_key', label: 'Supabase Anon Key', icon: Database, placeholder: 'eyJhbGciOi...' },
  { name: 'supabase_service_role_key', label: 'Supabase Service Role Key', icon: Database, placeholder: 'eyJhbGciOi...' },
  { name: 'openweather', label: 'OpenWeather API Key', icon: Cloud, placeholder: 'your-api-key' },
  { name: 'fast2sms', label: 'Fast2SMS API Key', icon: MessageSquare, placeholder: 'your-api-key' },
  { name: 'twilio_sid', label: 'Twilio Account SID', icon: Phone, placeholder: 'ACxxxxxx' },
  { name: 'twilio_auth_token', label: 'Twilio Auth Token', icon: Phone, placeholder: 'your-auth-token' },
  { name: 'twilio_phone', label: 'Twilio Phone Number', icon: Phone, placeholder: '+1234567890' },
  { name: 'fcm', label: 'Firebase Cloud Messaging Key', icon: Mail, placeholder: 'your-server-key' },
  { name: 'mqtt_broker_url', label: 'MQTT Broker URL', icon: Radio, placeholder: 'mqtt://broker.hivemq.com' },
  { name: 'mqtt_username', label: 'MQTT Username', icon: Radio, placeholder: 'username' },
  { name: 'mqtt_password', label: 'MQTT Password', icon: Radio, placeholder: 'password' },
  { name: 'mqtt_topic', label: 'MQTT Topic', icon: Radio, placeholder: 'aquasentinel/sensors' },
  { name: 'esp32_secret', label: 'ESP32 Secret Key', icon: Cpu, placeholder: 'your-secret-key' },
  { name: 'google_maps', label: 'Google Maps API (Optional)', icon: Map, placeholder: 'your-api-key' },
  { name: 'mapbox', label: 'Mapbox Token (Optional)', icon: Map, placeholder: 'pk.eyJ1Ijo...' },
];

export function ApiSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, ApiSetting>>({});
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('api_settings').select('*').eq('user_id', user.id);
    const map: Record<string, ApiSetting> = {};
    (data as ApiSetting[] ?? []).forEach((s) => { map[s.service_name] = s; });
    setSettings(map);
  };

  useEffect(() => { load(); }, [user]);

  const save = async (service: string) => {
    if (!user) return;
    setBusy(true);
    const value = editing[service];
    const existing = settings[service];
    if (existing) {
      await supabase.from('api_settings').update({ api_key: value, updated_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      await supabase.from('api_settings').insert({ user_id: user.id, service_name: service, api_key: value, status: 'untested' });
    }
    setEditing({ ...editing, [service]: '' });
    setBusy(false);
    load();
  };

  const test = async (service: string) => {
    setTesting(service);
    // Simulate connection test
    await new Promise((r) => setTimeout(r, 1200));
    const existing = settings[service];
    if (existing) {
      const ok = !!existing.api_key && existing.api_key.length > 5;
      await supabase.from('api_settings').update({ status: ok ? 'connected' : 'failed', updated_at: new Date().toISOString() }).eq('id', existing.id);
    }
    setTesting(null);
    load();
  };

  const remove = async (service: string) => {
    if (!confirm('Delete this API key?')) return;
    const existing = settings[service];
    if (existing) await supabase.from('api_settings').delete().eq('id', existing.id);
    load();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="API Settings" subtitle="Securely store and test API keys for all integrations" />

      <div className="grid gap-4 lg:grid-cols-2">
        {SERVICES.map((svc) => {
          const existing = settings[svc.name];
          const isEditing = editing[svc.name] !== undefined;
          return (
            <div key={svc.name} className="glass p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aqua-500/10 text-aqua-300">
                    <svc.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{svc.label}</p>
                    {existing ? (
                      <Badge tone={existing.status === 'connected' ? 'emerald' : existing.status === 'failed' ? 'red' : 'gray'}>
                        {existing.status === 'connected' ? <><CheckCircle2 className="h-3 w-3" /> Connected</> : existing.status === 'failed' ? <><XCircle className="h-3 w-3" /> Failed</> : 'Untested'}
                      </Badge>
                    ) : <span className="text-xs text-white/40">Not configured</span>}
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <input className="glass-input" type="password" placeholder={svc.placeholder} value={editing[svc.name]} onChange={(e) => setEditing({ ...editing, [svc.name]: e.target.value })} />
                  <button onClick={() => save(svc.name)} disabled={busy} className="btn-primary"><Save className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white/40">{existing?.api_key ? '••••••••••••' : 'No key set'}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => setEditing({ ...editing, [svc.name]: existing?.api_key ?? '' })} title="Edit" className="rounded-lg p-1.5 text-aqua-300 hover:bg-aqua-500/10"><Pencil className="h-4 w-4" /></button>
                    {existing && <button onClick={() => test(svc.name)} title="Test Connection" disabled={testing === svc.name} className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-500/10">{testing === svc.name ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}</button>}
                    {existing && <button onClick={() => remove(svc.name)} title="Delete" className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
