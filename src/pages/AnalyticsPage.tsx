import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import { BarChart3, Download, Droplets, CloudRain, Battery, Thermometer } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

type Range = 'week' | 'month' | 'year';

export function AnalyticsPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [range, setRange] = useState<Range>('week');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const [{ data: devs }, { data: readings }] = await Promise.all([
        supabase.from('devices').select('id,node_id').eq('user_id', user.id),
        supabase.from('sensor_data').select('*').eq('user_id', user.id).order('timestamp', { ascending: true }).limit(2000),
      ]);
      setDevices(devs ?? []);
      setRows(readings ?? []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = useMemo(() => {
    const now = Date.now();
    const cutoff = range === 'week' ? 7 : range === 'month' ? 30 : 365;
    return rows.filter((r) => now - new Date(r.timestamp).getTime() < cutoff * 24 * 3600 * 1000);
  }, [rows, range]);

  const byDay = useMemo(() => {
    const map: Record<string, any> = {};
    filtered.forEach((r) => {
      const key = new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!map[key]) map[key] = { water: [], rain: [], battery: [], temp: [] };
      map[key].water.push(r.water_level);
      map[key].battery.push(r.battery);
      map[key].temp.push(r.temperature);
      map[key].rain.push(r.rain_detected ? 1 : 0);
    });
    return map;
  }, [filtered]);

  const labels = Object.keys(byDay);
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
  const waterData = labels.map((k) => avg(byDay[k].water));
  const rainData = labels.map((k) => byDay[k].rain.filter(Boolean).length);
  const batteryData = labels.map((k) => avg(byDay[k].battery));
  const tempData = labels.map((k) => avg(byDay[k].temp));

  const baseOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8' } } },
    scales: {
      x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.08)' } },
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.08)' } },
    },
  };

  const exportCSV = () => {
    const header = 'timestamp,node_id,water_level,rain_detected,temperature,humidity,battery,signal_strength\n';
    const body = filtered.map((r) => `${r.timestamp},${r.node_id},${r.water_level},${r.rain_detected},${r.temperature},${r.humidity},${r.battery},${r.signal_strength}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `aquasentinel-analytics-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner label="Loading analytics…" />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        subtitle="Trends and historical analysis of sensor data"
        action={
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as Range[]).map((r) => (
              <button key={r} onClick={() => setRange(r)} className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${range === r ? 'bg-aqua-500/20 text-aqua-200' : 'text-white/50 hover:bg-white/5'}`}>
                {r}
              </button>
            ))}
            <button onClick={exportCSV} className="btn-ghost"><Download className="h-4 w-4" /> Export CSV</button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={BarChart3} title="No analytics data" message="Sensor readings will appear here once devices start reporting." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2"><Droplets className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Water Level Trend</h3></div>
            <div className="h-64"><Line data={{ labels, datasets: [{ label: 'Water Level (cm)', data: waterData, borderColor: '#1ac8ff', backgroundColor: 'rgba(26,200,255,0.15)', fill: true, tension: 0.4 }] }} options={baseOpts} /></div>
          </div>
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2"><CloudRain className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">Rainfall Trend</h3></div>
            <div className="h-64"><Bar data={{ labels, datasets: [{ label: 'Rain detections', data: rainData, backgroundColor: '#00b8e6', borderRadius: 6 }] }} options={baseOpts} /></div>
          </div>
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2"><Battery className="h-5 w-5 text-emerald-300" /><h3 className="font-semibold text-white">Battery Trend</h3></div>
            <div className="h-64"><Line data={{ labels, datasets: [{ label: 'Battery (%)', data: batteryData, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)', fill: true, tension: 0.4 }] }} options={baseOpts} /></div>
          </div>
          <div className="glass p-5">
            <div className="mb-4 flex items-center gap-2"><Thermometer className="h-5 w-5 text-orange-300" /><h3 className="font-semibold text-white">Temperature Trend</h3></div>
            <div className="h-64"><Line data={{ labels, datasets: [{ label: 'Temperature (°C)', data: tempData, borderColor: '#fb923c', backgroundColor: 'rgba(251,146,60,0.15)', fill: true, tension: 0.4 }] }} options={baseOpts} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
