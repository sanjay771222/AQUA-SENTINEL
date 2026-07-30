import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import type { Device, SensorData, Alert } from '@/lib/types';
import { levelFromWater } from '@/lib/types';

export interface LiveSnapshot {
  devices: Device[];
  latest: Record<string, SensorData | undefined>;
  alerts: Alert[];
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useLiveData(): LiveSnapshot {
  const { user, settings } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [latest, setLatest] = useState<Record<string, SensorData | undefined>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: devs }, { data: alrts }] = await Promise.all([
      supabase.from('devices').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    const devList = (devs as Device[]) ?? [];
    setDevices(devList);
    setAlerts((alrts as Alert[]) ?? []);

    const latestMap: Record<string, SensorData | undefined> = {};
    await Promise.all(
      devList.map(async (d) => {
        const { data } = await supabase
          .from('sensor_data')
          .select('*')
          .eq('device_id', d.id)
          .order('timestamp', { ascending: false })
          .limit(1)
          .maybeSingle();
        latestMap[d.id] = data as SensorData | undefined;
      })
    );
    setLatest(latestMap);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Realtime subscriptions
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('live-sensor')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_data', filter: `user_id=eq.${user.id}` }, async (payload) => {
        const row = payload.new as SensorData;
        setLatest((prev) => {
          const existing = prev[row.device_id ?? ''] ?? undefined;
          if (existing && new Date(row.timestamp) < new Date(existing.timestamp)) return prev;
          return { ...prev, [row.device_id ?? '']: row };
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts', filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from('alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
        setAlerts((data as Alert[]) ?? []);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `user_id=eq.${user.id}` }, async () => {
        const { data } = await supabase.from('devices').select('*').eq('user_id', user.id).order('created_at');
        setDevices((data as Device[]) ?? []);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Auto-generate alerts based on water level vs settings
  useEffect(() => {
    if (!user || !settings) return;
    Object.entries(latest).forEach(async ([deviceId, reading]) => {
      if (!reading) return;
      const level = levelFromWater(reading.water_level, settings);
      if (level === 'safe') return;
      const { data: existing } = await supabase
        .from('alerts')
        .select('id')
        .eq('device_id', deviceId)
        .eq('status', 'active')
        .maybeSingle();
      if (existing) return;
      await supabase.from('alerts').insert({
        user_id: user.id,
        device_id: deviceId,
        node_id: reading.node_id,
        alert_level: level,
        message: `Water level at ${reading.node_id} reached ${reading.water_level}cm (${level.toUpperCase()})`,
        status: 'active',
      });
    });
  }, [latest, user, settings]);

  return { devices, latest, alerts, loading, refresh };
}
