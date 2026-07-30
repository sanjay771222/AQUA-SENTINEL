export type AlertLevel = 'safe' | 'caution' | 'warning' | 'danger';
export type DeviceStatus = 'online' | 'offline' | 'disabled';

export interface Device {
  id: string;
  user_id: string;
  node_id: string;
  name: string;
  location_name: string | null;
  latitude: number;
  longitude: number;
  battery: number;
  signal_strength: number;
  firmware_version: string;
  status: DeviceStatus;
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  user_id: string;
  device_id: string | null;
  node_id: string;
  water_level: number;
  rain_detected: boolean;
  temperature: number;
  humidity: number;
  battery: number;
  signal_strength: number;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
}

export interface Alert {
  id: string;
  user_id: string;
  device_id: string | null;
  node_id: string;
  alert_level: AlertLevel;
  message: string | null;
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface WeatherRecord {
  id: string;
  user_id: string;
  location: string;
  temperature: number | null;
  humidity: number | null;
  pressure: number | null;
  wind_speed: number | null;
  rain_forecast: string | null;
  forecast_data: any;
  recorded_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  channel: 'sms' | 'voice' | 'push' | 'email';
  recipient: string | null;
  message: string | null;
  status: 'pending' | 'delivered' | 'failed';
  sent_at: string | null;
}

export interface ReportRecord {
  id: string;
  user_id: string;
  report_type: string;
  period_start: string | null;
  period_end: string | null;
  file_url: string | null;
  created_at: string;
}

export interface ApiSetting {
  id: string;
  user_id: string;
  service_name: string;
  api_key: string | null;
  config: any;
  status: 'untested' | 'connected' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id: string;
  user_id: string;
  safe_level: number;
  caution_level: number;
  warning_level: number;
  danger_level: number;
  rain_threshold: number;
  refresh_interval: number;
  dark_mode: boolean;
  language: string;
  updated_at: string;
}

export interface LocationRecord {
  id: string;
  user_id: string;
  name: string;
  type: 'safe_zone' | 'relief_center' | 'sensor';
  latitude: number;
  longitude: number;
  address: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'operator' | 'viewer';
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export const ALERT_META: Record<AlertLevel, { label: string; color: string; bg: string; ring: string }> = {
  safe: { label: 'Safe', color: 'text-emerald-400', bg: 'bg-emerald-500/15', ring: 'ring-emerald-500/30' },
  caution: { label: 'Caution', color: 'text-yellow-400', bg: 'bg-yellow-500/15', ring: 'ring-yellow-500/30' },
  warning: { label: 'Warning', color: 'text-orange-400', bg: 'bg-orange-500/15', ring: 'ring-orange-500/30' },
  danger: { label: 'Danger', color: 'text-red-400', bg: 'bg-red-500/15', ring: 'ring-red-500/30' },
};

export function levelFromWater(water: number, s: { safe_level: number; caution_level: number; warning_level: number; danger_level: number }): AlertLevel {
  if (water >= s.danger_level) return 'danger';
  if (water >= s.warning_level) return 'warning';
  if (water >= s.caution_level) return 'caution';
  return 'safe';
}
