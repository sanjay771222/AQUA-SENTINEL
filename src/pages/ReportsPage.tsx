import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { FileText, FileDown, FileSpreadsheet, Calendar } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

export function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('daily');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('reports').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setReports(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const generate = async (type: 'pdf' | 'excel' | 'csv') => {
    if (!user) return;
    const now = new Date();
    const start = new Date();
    if (period === 'daily') start.setDate(now.getDate() - 1);
    if (period === 'weekly') start.setDate(now.getDate() - 7);
    if (period === 'monthly') start.setMonth(now.getMonth() - 1);
    if (period === 'yearly') start.setFullYear(now.getFullYear() - 1);

    const { data: readings } = await supabase.from('sensor_data').select('*').eq('user_id', user.id).gte('timestamp', start.toISOString()).order('timestamp', { ascending: true });

    const header = 'timestamp,node_id,water_level,rain_detected,temperature,humidity,battery,signal_strength\n';
    const body = (readings ?? []).map((r) => `${r.timestamp},${r.node_id},${r.water_level},${r.rain_detected},${r.temperature},${r.humidity},${r.battery},${r.signal_strength}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aquasentinel-${period}-report.${type === 'excel' ? 'csv' : type}`;
    a.click();
    URL.revokeObjectURL(url);

    await supabase.from('reports').insert({
      user_id: user.id,
      report_type: `${period}_${type}`,
      period_start: start.toISOString(),
      period_end: now.toISOString(),
      file_url: `aquasentinel-${period}-report.${type}`,
    });
    load();
  };

  if (loading) return <LoadingSpinner label="Loading reports…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Generate and export reports for any time period" />

      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Generate Report</h3></div>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['daily', 'weekly', 'monthly', 'yearly'] as Period[]).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${period === p ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>{p}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => generate('pdf')} className="btn-primary"><FileDown className="h-4 w-4" /> Download PDF</button>
          <button onClick={() => generate('excel')} className="btn-ghost"><FileSpreadsheet className="h-4 w-4" /> Download Excel</button>
          <button onClick={() => generate('csv')} className="btn-ghost"><FileText className="h-4 w-4" /> Download CSV</button>
        </div>
      </div>

      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2"><FileText className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Report History</h3></div>
        {reports.length === 0 ? (
          <EmptyState icon={FileText} title="No reports generated yet" message="Generated reports will be listed here." />
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">{r.report_type}</p>
                  <p className="text-xs text-white/40">{new Date(r.period_start).toLocaleDateString()} → {new Date(r.period_end).toLocaleDateString()}</p>
                </div>
                <span className="text-xs text-white/40">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
