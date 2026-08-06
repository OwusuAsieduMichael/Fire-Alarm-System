import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import {
  mapAlert,
  mapDevice,
  offlineLive,
  readingToLive,
  toHistory,
  userDb,
} from "@/server/supabase-data";

export const runtime = "nodejs";

/** Live telemetry from Supabase — stays OFFLINE until the ESP32 posts data. */
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: devices } = await db
    .from("devices")
    .select("*")
    .order("created_at", { ascending: true });

  const deviceRow = devices?.[0] ?? null;
  if (!deviceRow) {
    return json({
      live: offlineLive(null),
      recentAlerts: [],
      smokeHistory: [],
    });
  }

  const device = mapDevice(deviceRow);

  const [{ data: latest }, { data: history }, { data: alerts }] =
    await Promise.all([
      db
        .from("sensor_readings")
        .select("*")
        .eq("device_id", device.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      db
        .from("sensor_readings")
        .select("*")
        .eq("device_id", device.id)
        .order("created_at", { ascending: false })
        .limit(60),
      db
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

  const reading = latest
    ? {
        id: latest.id,
        deviceId: latest.device_id,
        smokeLevel: latest.smoke_level,
        flameDetected: latest.flame_detected,
        temperature: latest.temperature,
        humidity: latest.humidity,
        buzzerActive: latest.buzzer_active,
        ledStatus: latest.led_status,
        alarmActive: latest.alarm_active,
        lcdMessage: latest.lcd_message,
        createdAt: latest.created_at,
      }
    : null;

  // Mark stale devices offline for the UI
  const live = readingToLive(device, reading);
  if (live.status === "OFFLINE" && device.status === "ONLINE") {
    // Display-only; ESP32 heartbeat will set ONLINE again
  }

  return json({
    live,
    recentAlerts: (alerts || []).map((a) => mapAlert(a, device.name)),
    smokeHistory: toHistory(history || []),
  });
}
