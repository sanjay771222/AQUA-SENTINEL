import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useLiveData } from '@/lib/useLiveData';
import { useAuth } from '@/lib/auth';
import { levelFromWater, ALERT_META, type AlertLevel } from '@/lib/types';
import { PageHeader, LoadingSpinner, EmptyState, Badge } from '@/components/ui';
import { Map as MapIcon } from 'lucide-react';

const COLORS: Record<AlertLevel, string> = {
  safe: '#10b981',
  caution: '#facc15',
  warning: '#fb923c',
  danger: '#ef4444',
};

export function FloodMapPage() {
  const { devices, latest, loading } = useLiveData();
  const { settings } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    devices.forEach((d) => {
      const r = latest[d.id];
      const level = settings && r ? levelFromWater(r.water_level, settings) : 'safe';
      const color = COLORS[level];
      const icon = L.divIcon({
        className: 'aqua-marker',
        html: `<div style="width:18px;height:18px;border-radius:50%;background:${color};box-shadow:0 0 0 4px ${color}40,0 0 12px ${color};border:2px solid #fff;"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      const marker = L.marker([d.latitude, d.longitude], { icon }).addTo(map);
      const ago = r ? new Date(r.timestamp).toLocaleString() : 'No data';
      marker.bindPopup(`
        <div style="min-width:200px;font-family:Inter,sans-serif;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${color};display:inline-block;"></span>
            <strong style="font-size:14px;">${d.name}</strong>
          </div>
          <div style="font-size:12px;line-height:1.7;color:#cbd5e1;">
            <div><b>Node ID:</b> ${d.node_id}</div>
            <div><b>Water Level:</b> ${r ? r.water_level.toFixed(1) + ' cm' : '—'}</div>
            <div><b>Rain:</b> ${r ? (r.rain_detected ? 'Detected' : 'Clear') : '—'}</div>
            <div><b>Temperature:</b> ${r ? r.temperature.toFixed(1) + ' °C' : '—'}</div>
            <div><b>Battery:</b> ${r ? r.battery.toFixed(0) + ' %' : '—'}</div>
            <div><b>Signal:</b> ${r ? r.signal_strength.toFixed(0) + ' %' : '—'}</div>
            <div><b>Latitude:</b> ${d.latitude.toFixed(4)}</div>
            <div><b>Longitude:</b> ${d.longitude.toFixed(4)}</div>
            <div><b>Last Updated:</b> ${ago}</div>
          </div>
        </div>
      `);
      markersRef.current.push(marker);
    });

    if (devices.length > 0) {
      const bounds = L.latLngBounds(devices.map((d) => [d.latitude, d.longitude] as [number, number]));
      map.fitBounds(bounds.pad(0.2));
    }
  }, [devices, latest, settings]);

  if (loading) return <LoadingSpinner label="Loading map…" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Live Flood Map" subtitle="All ESP32 sensor nodes with real-time water level status" />

      {/* Legend */}
      <div className="glass flex flex-wrap items-center gap-4 p-4">
        <span className="text-sm font-medium text-white/70">Legend:</span>
        {(Object.keys(ALERT_META) as AlertLevel[]).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ background: COLORS[k] }} />
            <span className="text-sm text-white/60">{ALERT_META[k].label}</span>
          </div>
        ))}
      </div>

      {devices.length === 0 ? (
        <EmptyState icon={MapIcon} title="No devices on map" message="Add devices with coordinates to see them plotted here." />
      ) : (
        <div className="glass overflow-hidden p-1">
          <div ref={containerRef} className="h-[600px] w-full rounded-xl" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {devices.map((d) => {
          const r = latest[d.id];
          const level = settings && r ? levelFromWater(r.water_level, settings) : 'safe';
          return (
            <Badge key={d.id} tone={level === 'safe' ? 'emerald' : level === 'caution' ? 'yellow' : level === 'warning' ? 'orange' : 'red'}>
              {d.node_id}: {r ? r.water_level.toFixed(0) + 'cm' : 'no data'}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
