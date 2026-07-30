import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { ALERT_META, type Alert, type AlertLevel } from '@/lib/types';
import { Siren, CheckCircle2, XCircle, Trash2, FileDown, FileSpreadsheet } from 'lucide-react';

type Filter = 'today' | 'week' | 'month' | 'all';

export function AlertsPage() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [severity, setSeverity] = useState<AlertLevel | 'all'>('all');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setAlerts((data as Alert[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = alerts.filter((a) => {
    const now = Date.now();
    const age = now - new Date(a.created_at).getTime();
    if (filter === 'today' && age > 86400000) return false;
    if (filter === 'week' && age > 604800000) return false;
    if (filter === 'month' && age > 2592000000) return false;
    if (severity !== 'all' && a.alert_level !== severity) return false;
    return true;
  });

  const update = async (id: string, status: Alert['status']) => {
    await supabase.from('alerts').update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id);
    load();
  };
  const remove = async (id: string) => {
    await supabase.from('alerts').delete().eq('id', id);
    load();
  };

  const exportPDF = () => window.print();
  const exportExcel = () => {
    const header = 'Date,Time,Node ID,Alert Level,Status,Message\n';
    const body = filtered.map((a) => {
      const d = new Date(a.created_at);
      return `${d.toLocaleDateString()},${d.toLocaleTimeString()},${a.node_id},${a.alert_level},${a.status},${a.message ?? ''}`;
    }).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'aquasentinel-alerts.csv'; a.click();
  };

  if (loading) return <LoadingSpinner label="Loading alerts…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Alerts" subtitle="Flood warning alerts with acknowledge, resolve, and export"
        action={
          <div className="flex gap-2">
            <button onClick={exportPDF} className="btn-ghost"><FileDown className="h-4 w-4" /> PDF</button>
            <button onClick={exportExcel} className="btn-ghost"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          </div>
        }
      />

      <div className="glass flex flex-wrap items-center gap-3 p-4">
        <span className="text-sm font-medium text-white/60">Filter:</span>
        {(['today', 'week', 'month', 'all'] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${filter === f ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>{f}</button>
        ))}
        <span className="mx-2 text-white/20">|</span>
        <span className="text-sm font-medium text-white/60">Severity:</span>
        {(['all', 'safe', 'caution', 'warning', 'danger'] as const).map((s) => (
          <button key={s} onClick={() => setSeverity(s)} className={`rounded-lg px-3 py-1.5 text-sm capitalize transition ${severity === s ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>{s}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Siren} title="No alerts found" message="No alerts match your current filters." />
      ) : (
        <div className="glass overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-white/50">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Node ID</th>
                <th className="px-4 py-3">Alert Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((a) => {
                const d = new Date(a.created_at);
                const m = ALERT_META[a.alert_level];
                return (
                  <tr key={a.id} className="transition hover:bg-white/5">
                    <td className="px-4 py-3 text-white/70">{d.toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-white/70">{d.toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-medium text-white">{a.node_id}</td>
                    <td className="px-4 py-3"><Badge tone={a.alert_level === 'safe' ? 'emerald' : a.alert_level === 'caution' ? 'yellow' : a.alert_level === 'warning' ? 'orange' : 'red'}>{m.label}</Badge></td>
                    <td className="px-4 py-3"><Badge tone={a.status === 'active' ? 'red' : a.status === 'acknowledged' ? 'yellow' : 'emerald'}>{a.status}</Badge></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => update(a.id, 'acknowledged')} title="Acknowledge" className="rounded-lg p-1.5 text-yellow-300 hover:bg-yellow-500/10"><CheckCircle2 className="h-4 w-4" /></button>
                        <button onClick={() => update(a.id, 'resolved')} title="Resolve" className="rounded-lg p-1.5 text-emerald-300 hover:bg-emerald-500/10"><XCircle className="h-4 w-4" /></button>
                        <button onClick={() => remove(a.id)} title="Delete" className="rounded-lg p-1.5 text-red-300 hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
