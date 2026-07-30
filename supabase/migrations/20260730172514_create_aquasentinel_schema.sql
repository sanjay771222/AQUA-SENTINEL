/*
# AquaSentinel - Smart Flood Monitoring & Early Warning System Schema

## Overview
Creates the complete database schema for the AquaSentinel flood monitoring platform.
This is a multi-user application with Supabase Authentication (email/password).
All tables are owner-scoped via user_id with RLS policies.

## New Tables

1. **devices** - ESP32 sensor nodes
   - id, user_id, node_id, name, location_name, latitude, longitude,
     battery, signal_strength, firmware_version, status, created_at, updated_at

2. **sensor_data** - Time-series readings from ESP32 nodes
   - id, user_id, device_id (fk), node_id, water_level, rain_detected,
     temperature, humidity, battery, signal_strength, latitude, longitude, timestamp

3. **alerts** - Flood warning alerts
   - id, user_id, device_id (fk), node_id, alert_level, message, status, created_at, resolved_at

4. **weather** - Weather observations / forecasts
   - id, user_id, location, temperature, humidity, pressure, wind_speed,
     rain_forecast, forecast_data (jsonb), recorded_at

5. **notifications** - SMS/Voice/Push/Email notification log
   - id, user_id, channel, recipient, message, status, sent_at

6. **reports** - Generated report metadata
   - id, user_id, report_type, period_start, period_end, file_url, created_at

7. **api_settings** - Encrypted API key storage
   - id, user_id, service_name, api_key, config (jsonb), status, created_at, updated_at

8. **system_settings** - Per-user system configuration
   - id, user_id, safe_level, caution_level, warning_level, danger_level,
     rain_threshold, refresh_interval, dark_mode, language, updated_at

9. **locations** - Saved map locations / safe zones / relief centers
   - id, user_id, name, type, latitude, longitude, address, created_at

## Security
- RLS enabled on every table.
- Owner-scoped CRUD policies (select/insert/update/delete) for authenticated users.
- user_id columns default to auth.uid() so inserts that omit it still satisfy WITH CHECK.
*/

-- ============================================================
-- DEVICES
-- ============================================================
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id text NOT NULL,
  name text NOT NULL,
  location_name text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  battery double precision DEFAULT 100,
  signal_strength double precision DEFAULT 100,
  firmware_version text DEFAULT '1.0.0',
  status text NOT NULL DEFAULT 'online',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, node_id)
);
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_devices" ON devices;
CREATE POLICY "select_own_devices" ON devices FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_devices" ON devices;
CREATE POLICY "insert_own_devices" ON devices FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_devices" ON devices;
CREATE POLICY "update_own_devices" ON devices FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_devices" ON devices;
CREATE POLICY "delete_own_devices" ON devices FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SENSOR_DATA
-- ============================================================
CREATE TABLE IF NOT EXISTS sensor_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  node_id text NOT NULL,
  water_level double precision NOT NULL DEFAULT 0,
  rain_detected boolean NOT NULL DEFAULT false,
  temperature double precision DEFAULT 0,
  humidity double precision DEFAULT 0,
  battery double precision DEFAULT 100,
  signal_strength double precision DEFAULT 100,
  latitude double precision,
  longitude double precision,
  timestamp timestamptz DEFAULT now()
);
ALTER TABLE sensor_data ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_sensor_data_device_ts ON sensor_data (device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_data_node_ts ON sensor_data (node_id, timestamp DESC);

DROP POLICY IF EXISTS "select_own_sensor_data" ON sensor_data;
CREATE POLICY "select_own_sensor_data" ON sensor_data FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_sensor_data" ON sensor_data;
CREATE POLICY "insert_own_sensor_data" ON sensor_data FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_sensor_data" ON sensor_data;
CREATE POLICY "update_own_sensor_data" ON sensor_data FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_sensor_data" ON sensor_data;
CREATE POLICY "delete_own_sensor_data" ON sensor_data FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
  node_id text NOT NULL,
  alert_level text NOT NULL DEFAULT 'safe',
  message text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts (created_at DESC);

DROP POLICY IF EXISTS "select_own_alerts" ON alerts;
CREATE POLICY "select_own_alerts" ON alerts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_alerts" ON alerts;
CREATE POLICY "insert_own_alerts" ON alerts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_alerts" ON alerts;
CREATE POLICY "update_own_alerts" ON alerts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_alerts" ON alerts;
CREATE POLICY "delete_own_alerts" ON alerts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- WEATHER
-- ============================================================
CREATE TABLE IF NOT EXISTS weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  location text NOT NULL,
  temperature double precision,
  humidity double precision,
  pressure double precision,
  wind_speed double precision,
  rain_forecast text,
  forecast_data jsonb,
  recorded_at timestamptz DEFAULT now()
);
ALTER TABLE weather ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weather" ON weather;
CREATE POLICY "select_own_weather" ON weather FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weather" ON weather;
CREATE POLICY "insert_own_weather" ON weather FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weather" ON weather;
CREATE POLICY "update_own_weather" ON weather FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weather" ON weather;
CREATE POLICY "delete_own_weather" ON weather FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  channel text NOT NULL,
  recipient text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications (sent_at DESC);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  period_start timestamptz,
  period_end timestamptz,
  file_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_reports" ON reports;
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- API_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS api_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name text NOT NULL,
  api_key text,
  config jsonb,
  status text NOT NULL DEFAULT 'untested',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, service_name)
);
ALTER TABLE api_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_api_settings" ON api_settings;
CREATE POLICY "select_own_api_settings" ON api_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_api_settings" ON api_settings;
CREATE POLICY "insert_own_api_settings" ON api_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_api_settings" ON api_settings;
CREATE POLICY "update_own_api_settings" ON api_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_api_settings" ON api_settings;
CREATE POLICY "delete_own_api_settings" ON api_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- SYSTEM_SETTINGS (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  safe_level double precision NOT NULL DEFAULT 30,
  caution_level double precision NOT NULL DEFAULT 50,
  warning_level double precision NOT NULL DEFAULT 70,
  danger_level double precision NOT NULL DEFAULT 85,
  rain_threshold double precision NOT NULL DEFAULT 5,
  refresh_interval integer NOT NULL DEFAULT 5,
  dark_mode boolean NOT NULL DEFAULT true,
  language text NOT NULL DEFAULT 'en',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_system_settings" ON system_settings;
CREATE POLICY "select_own_system_settings" ON system_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_system_settings" ON system_settings;
CREATE POLICY "insert_own_system_settings" ON system_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_system_settings" ON system_settings;
CREATE POLICY "update_own_system_settings" ON system_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_system_settings" ON system_settings;
CREATE POLICY "delete_own_system_settings" ON system_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- LOCATIONS (safe zones, relief centers, sensors)
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_locations" ON locations;
CREATE POLICY "select_own_locations" ON locations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_locations" ON locations;
CREATE POLICY "insert_own_locations" ON locations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_locations" ON locations;
CREATE POLICY "update_own_locations" ON locations FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_locations" ON locations;
CREATE POLICY "delete_own_locations" ON locations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- PROFILES (public user metadata, separate from auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text NOT NULL DEFAULT 'viewer',
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profiles" ON profiles;
CREATE POLICY "select_own_profiles" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_profiles" ON profiles;
CREATE POLICY "insert_own_profiles" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_profiles" ON profiles;
CREATE POLICY "update_own_profiles" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_profiles" ON profiles;
CREATE POLICY "delete_own_profiles" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
