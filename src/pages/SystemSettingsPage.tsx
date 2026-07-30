import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner } from '@/components/ui';
import { type SystemSettings as Settings } from '@/lib/types';
import { Settings as SettingsIcon, Save, Droplets, CloudRain, Clock, Globe, Moon, Sun } from 'lucide-react';

export function SystemSettingsPage() {
  const { user, settings, refreshSettings } = useAuth();
  const [form, setForm] = useState<Settings | null>(settings);
  const [busy, setBusy] = useState(false);

  useEffect(() => { setForm(settings); }, [settings]);

  if (!form) return <LoadingSpinner label="Loading settings…" />;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { data } = await supabase.from('system_settings').select('id').eq('user_id', user.id).maybeSingle();
    if (data) {
      await supabase.from('system_settings').update({ ...form, updated_at: new Date().toISOString() }).eq('id', data.id);
    } else {
      await supabase.from('system_settings').insert({ ...form, user_id: user.id });
    }
    await refreshSettings();
    setBusy(false);
  };

  const set = (k: keyof Settings, v: any) => setForm({ ...form!, [k]: v });

  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" subtitle="Configure alert thresholds, refresh rate, and appearance" />

      <form onSubmit={save} className="space-y-6">
        {/* Thresholds */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><Droplets className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Water Level Thresholds</h3></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Safe Level (cm)" icon={Droplets} accent="text-emerald-300">
              <input type="number" className="glass-input" value={form.safe_level} onChange={(e) => set('safe_level', parseFloat(e.target.value))} />
            </Field>
            <Field label="Caution Level (cm)" icon={Droplets} accent="text-yellow-300">
              <input type="number" className="glass-input" value={form.caution_level} onChange={(e) => set('caution_level', parseFloat(e.target.value))} />
            </Field>
            <Field label="Warning Level (cm)" icon={Droplets} accent="text-orange-300">
              <input type="number" className="glass-input" value={form.warning_level} onChange={(e) => set('warning_level', parseFloat(e.target.value))} />
            </Field>
            <Field label="Danger Level (cm)" icon={Droplets} accent="text-red-300">
              <input type="number" className="glass-input" value={form.danger_level} onChange={(e) => set('danger_level', parseFloat(e.target.value))} />
            </Field>
          </div>
        </div>

        {/* Other settings */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">General</h3></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Rain Threshold (mm)" icon={CloudRain}>
              <input type="number" className="glass-input" value={form.rain_threshold} onChange={(e) => set('rain_threshold', parseFloat(e.target.value))} />
            </Field>
            <Field label="Dashboard Refresh (sec)" icon={Clock}>
              <input type="number" className="glass-input" value={form.refresh_interval} onChange={(e) => set('refresh_interval', parseInt(e.target.value))} />
            </Field>
            <Field label="Language" icon={Globe}>
              <select className="glass-input" value={form.language} onChange={(e) => set('language', e.target.value)}>
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="bn">Bengali</option>
                <option value="mr">Marathi</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass p-6">
          <div className="mb-4 flex items-center gap-2"><Moon className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Appearance</h3></div>
          <div className="flex gap-3">
            <button type="button" onClick={() => set('dark_mode', true)} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition ${form.dark_mode ? 'border-aqua-500/40 bg-aqua-500/15 text-aqua-200' : 'border-white/10 bg-white/5 text-white/50'}`}>
              <Moon className="h-4 w-4" /> Dark Mode
            </button>
            <button type="button" onClick={() => set('dark_mode', false)} className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-medium transition ${!form.dark_mode ? 'border-aqua-500/40 bg-aqua-500/15 text-aqua-200' : 'border-white/10 bg-white/5 text-white/50'}`}>
              <Sun className="h-4 w-4" /> Light Mode
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={busy} className="btn-primary"><Save className="h-4 w-4" /> {busy ? 'Saving…' : 'Save Settings'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, icon: Icon, accent, children }: { label: string; icon: typeof Droplets; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-white/50">
        <Icon className={`h-3.5 w-3.5 ${accent ?? 'text-white/40'}`} /> {label}
      </label>
      {children}
    </div>
  );
}
