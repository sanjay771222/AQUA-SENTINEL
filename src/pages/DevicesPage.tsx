import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { type Device, type DeviceStatus } from '@/lib/types';
import {
  Cpu, Plus, Pencil, Trash2, RotateCw, Power, Search, MapPin, Battery, Signal,
} from 'lucide-react';

export function DevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('devices').select('*').eq('user_id', user.id).order('created_at');
    setDevices((data as Device[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = devices.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (search && !`${d.node_id} ${d.name} ${d.location_name ?? ''}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const remove = async (id: string) => {
    if (!confirm('Delete this device? This cannot be undone.')) return;
    await supabase.from('devices').delete().eq('id', id);
    load();
  };
  const restart = async (d: Device) => {
    await supabase.from('devices').update({ status: 'online', updated_at: new Date().toISOString() }).eq('id', d.id);
    load();
  };
  const toggleDisable = async (d: Device) => {
    const next = d.status === 'disabled' ? 'online' : 'disabled';
    await supabase.from('devices').update({ status: next, updated_at: new Date().toISOString() }).eq('id', d.id);
    load();
  };

  if (loading) return <LoadingSpinner label="Loading devices…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Device Management" subtitle="Add, edit, restart, and monitor ESP32 sensor nodes"
        action={<button onClick={() => { setEditing(null); setShowAdd(true); }} className="btn-primary"><Plus className="h-4 w-4" /> Add Device</button>}
      />

      <div className="glass flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input className="glass-input pl-10" placeholder="Search by node ID, name, or location…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2">
          {(['all', 'online', 'offline', 'disabled'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${statusFilter === s ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>{s}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Cpu} title="No devices" message="Add your first ESP32 sensor node to begin monitoring." />
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Battery</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Firmware</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((d) => (
                <tr key={d.id} className="transition hover:bg-white/5">
                  <td className="px-4 py-3"><div className="font-medium text-white">{d.node_id}</div><div className="text-xs text-white/40">{d.name}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1 text-white/70"><MapPin className="h-3.5 w-3.5" />{d.location_name || '—'}</div><div className="text-xs text-white/40">{d.latitude.toFixed(3)}, {d.longitude.toFixed(3)}</div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><Battery className="h-3.5 w-3.5 text-emerald-300" /><span className={d.battery < 20 ? 'text-red-300' : 'text-white/70'}>{d.battery.toFixed(0)}%</span></div></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-1"><Signal className="h-3.5 w-3.5 text-navy-200" /><span className="text-white/70">{d.signal_strength.toFixed(0)}%</span></div></td>
                  <td className="px-4 py-3 text-white/60">{d.firmware_version}</td>
                  <td className="px-4 py-3"><Badge tone={d.status === 'online' ? 'emerald' : d.status === 'offline' ? 'yellow' : 'gray'}>{d.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditing(d); setShowAdd(true); }} title="Edit" className="rounded-lg p-1.5 text-aqua-300 hover:bg-aqua-500/10"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => restart(d)} title="Restart" className="rounded-lg p-1.5 text-yellow-300 hover:bg-yellow-500/10"><RotateCw className="h-4 w-4" /></button>
                      <button onClick={() => toggleDisable(d)} title={d.status === 'disabled' ? 'Enable' : 'Disable'} className="rounded-lg p-1.5 text-orange-300 hover:bg-orange-500/10"><Power className="h-4 w-4" /></button>
                      <button onClick={() => remove(d.id)} title="Delete" className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <DeviceModal
          device={editing}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function DeviceModal({ device, onClose, onSaved }: { device: Device | null; onClose: () => void; onSaved: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    node_id: device?.node_id ?? '',
    name: device?.name ?? '',
    location_name: device?.location_name ?? '',
    latitude: device?.latitude ?? 19.076,
    longitude: device?.longitude ?? 72.8777,
    firmware_version: device?.firmware_version ?? '1.0.0',
  });
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    if (device) {
      await supabase.from('devices').update({ ...form, updated_at: new Date().toISOString() }).eq('id', device.id);
    } else {
      await supabase.from('devices').insert({ ...form, user_id: user.id, status: 'online', battery: 100, signal_strength: 100 });
    }
    setBusy(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={save} className="glass relative z-10 w-full max-w-lg space-y-4 p-6 animate-slide-up">
        <h3 className="text-lg font-bold text-white">{device ? 'Edit Device' : 'Add Device'}</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-xs text-white/50">Node ID</label><input className="glass-input" value={form.node_id} onChange={(e) => setForm({ ...form, node_id: e.target.value })} required /></div>
          <div><label className="mb-1 block text-xs text-white/50">Name</label><input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-white/50">Location Name</label><input className="glass-input" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} /></div>
          <div><label className="mb-1 block text-xs text-white/50">Latitude</label><input type="number" step="0.0001" className="glass-input" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })} required /></div>
          <div><label className="mb-1 block text-xs text-white/50">Longitude</label><input type="number" step="0.0001" className="glass-input" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })} required /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-xs text-white/50">Firmware Version</label><input className="glass-input" value={form.firmware_version} onChange={(e) => setForm({ ...form, firmware_version: e.target.value })} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : device ? 'Save Changes' : 'Add Device'}</button>
        </div>
      </form>
    </div>
  );
}
