import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SensorPayload {
  nodeId?: string;
  waterLevel?: number;
  rainDetected?: boolean;
  temperature?: number;
  humidity?: number;
  battery?: number;
  signalStrength?: number;
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  secretKey?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: SensorPayload = await req.json();

    // Validate ESP32 secret key
    const expectedSecret = Deno.env.get('ESP32_SECRET_KEY');
    if (!expectedSecret || body.secretKey !== expectedSecret) {
      return new Response(JSON.stringify({ error: 'Invalid or missing secret key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!body.nodeId) {
      return new Response(JSON.stringify({ error: 'nodeId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find the device by node_id
    const { data: device, error: devErr } = await supabase
      .from('devices')
      .select('id, user_id, latitude, longitude')
      .eq('node_id', body.nodeId)
      .maybeSingle();

    if (devErr || !device) {
      return new Response(JSON.stringify({ error: 'Device not registered' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Insert sensor data
    const { error: insertErr } = await supabase.from('sensor_data').insert({
      user_id: device.user_id,
      device_id: device.id,
      node_id: body.nodeId,
      water_level: body.waterLevel ?? 0,
      rain_detected: body.rainDetected ?? false,
      temperature: body.temperature ?? 0,
      humidity: body.humidity ?? 0,
      battery: body.battery ?? 100,
      signal_strength: body.signalStrength ?? 100,
      latitude: body.latitude ?? device.latitude,
      longitude: body.longitude ?? device.longitude,
      timestamp: body.timestamp ?? new Date().toISOString(),
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update device battery/signal/status
    await supabase.from('devices').update({
      battery: body.battery ?? 100,
      signal_strength: body.signalStrength ?? 100,
      status: 'online',
      updated_at: new Date().toISOString(),
    }).eq('id', device.id);

    return new Response(JSON.stringify({ success: true, nodeId: body.nodeId }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
