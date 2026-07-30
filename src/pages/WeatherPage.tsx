import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { PageHeader, LoadingSpinner, EmptyState } from '@/components/ui';
import {
  CloudRain, Thermometer, Gauge, Wind, MapPin, Search, Cloud, Sun, Cloudy,
  Droplets, Calendar,
} from 'lucide-react';

interface OWMCurrent {
  main: { temp: number; humidity: number; pressure: number };
  wind: { speed: number };
  weather: { id: number; main: string; description: string }[];
  name: string;
}
interface OWMDaily {
  list: { dt: number; main: { temp: number; humidity: number }; weather: { id: number; main: string }[]; wind: { speed: number } }[];
}

function weatherIcon(id: number) {
  if (id >= 200 && id < 300) return CloudRain;
  if (id >= 300 && id < 600) return CloudRain;
  if (id >= 600 && id < 700) return Cloud;
  if (id >= 700 && id < 800) return Cloudy;
  if (id === 800) return Sun;
  return Cloudy;
}

export function WeatherPage() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState<OWMCurrent | null>(null);
  const [daily, setDaily] = useState<OWMDaily['list'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from('api_settings').select('*').eq('user_id', user.id).eq('service_name', 'openweather').maybeSingle();
      if (data?.api_key) setApiKey(data.api_key);
    })();
  }, [user]);

  const fetchWeather = async (q: string) => {
    if (!apiKey) { setError('Add your OpenWeather API key in API Settings first.'); return; }
    setLoading(true); setError(null);
    try {
      const curRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=${apiKey}&units=metric`);
      if (!curRes.ok) throw new Error('City not found or invalid API key');
      const cur: OWMCurrent = await curRes.json();
      setCurrent(cur);
      const dailyRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${q}&appid=${apiKey}&units=metric`);
      if (dailyRes.ok) {
        const d: OWMDaily = await dailyRes.json();
        const byDay: Record<number, OWMDaily['list'][0]> = {};
        d.list.forEach((item) => { byDay[new Date(item.dt * 1000).getDate()] = item; });
        setDaily(Object.values(byDay).slice(0, 7));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (apiKey) fetchWeather(city); }, [apiKey, city]);

  return (
    <div className="space-y-6">
      <PageHeader title="Weather" subtitle="Current conditions and 7-day forecast via OpenWeather" />

      <div className="glass flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input className="glass-input pl-10" placeholder="Search city…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && search) { setCity(search); setSearch(''); } }} />
        </div>
        <button onClick={() => search && setCity(search)} className="btn-primary">Search</button>
      </div>

      {error && <div className="glass border-red-500/30 p-4 text-sm text-red-300">{error}</div>}

      {loading ? (
        <LoadingSpinner label="Fetching weather…" />
      ) : current ? (
        <>
          <div className="glass p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-aqua-500/10 text-aqua-300">
                  {(() => { const Icon = weatherIcon(current.weather[0].id); return <Icon className="h-8 w-8" />; })()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{current.name}</h3>
                  <p className="capitalize text-white/50">{current.weather[0].description}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-bold text-white">{Math.round(current.main.temp)}°C</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4"><Thermometer className="mb-2 h-5 w-5 text-orange-300" /><p className="text-xs text-white/50">Temperature</p><p className="text-lg font-semibold text-white">{current.main.temp}°C</p></div>
              <div className="rounded-xl bg-white/5 p-4"><Droplets className="mb-2 h-5 w-5 text-aqua-300" /><p className="text-xs text-white/50">Humidity</p><p className="text-lg font-semibold text-white">{current.main.humidity}%</p></div>
              <div className="rounded-xl bg-white/5 p-4"><Gauge className="mb-2 h-5 w-5 text-navy-200" /><p className="text-xs text-white/50">Pressure</p><p className="text-lg font-semibold text-white">{current.main.pressure} hPa</p></div>
              <div className="rounded-xl bg-white/5 p-4"><Wind className="mb-2 h-5 w-5 text-emerald-300" /><p className="text-xs text-white/50">Wind Speed</p><p className="text-lg font-semibold text-white">{current.wind.speed} m/s</p></div>
            </div>
          </div>

          {daily && (
            <div className="glass p-6">
              <div className="mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-aqua-300" /><h3 className="font-semibold text-white">7-Day Forecast</h3></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {daily.map((d, i) => {
                  const Icon = weatherIcon(d.weather[0].id);
                  const date = new Date(d.dt * 1000);
                  return (
                    <div key={i} className="rounded-xl bg-white/5 p-4 text-center transition hover:bg-white/10">
                      <p className="text-xs font-medium text-white/60">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <Icon className="mx-auto my-2 h-7 w-7 text-aqua-300" />
                      <p className="text-lg font-bold text-white">{Math.round(d.main.temp)}°</p>
                      <p className="text-xs text-white/40">{d.main.humidity}% humid</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : !error ? (
        <EmptyState icon={CloudRain} title="No weather data" message="Search a city to load current conditions." />
      ) : null}
    </div>
  );
}
