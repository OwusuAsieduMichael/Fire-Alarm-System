import { NextResponse } from "next/server";
import { getBearer, error, isResponse, requireUser } from "@/server/http";
import {
  mapAlert,
  mapDevice,
  offlineLive,
  readingToLive,
  toHistory,
  userDb,
} from "@/server/supabase-data";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

/** Live telemetry from Supabase — scoped to the caller's devices. */
export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const limited = rateLimit(`live:${user.id}`, 60, 60_000);
  if (!limited.ok) {
    return error(`Too many live polls. Retry in ${limited.retryAfterSec}s`, 429);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const url = new URL(req.url);
  const requestedId = url.searchParams.get("deviceId");

  let deviceQuery = db
    .from("devices")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);
  if (requestedId) {
    deviceQuery = db.from("devices").select("*").eq("id", requestedId).limit(1);
  }

  const { data: devices } = await deviceQuery;
  const deviceRow = devices?.[0] ?? null;
  if (!deviceRow) {
    return NextResponse.json(
      {
        live: offlineLive(null),
        recentAlerts: [],
        smokeHistory: [],
      },
      {
        headers: {
          "Cache-Control": "private, max-age=2",
        },
      }
    );
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
        .eq("device_id", device.id)
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

  const live = readingToLive(device, reading);

  return NextResponse.json(
    {
      live,
      recentAlerts: (alerts || []).map((a) => mapAlert(a, device.name)),
      smokeHistory: toHistory(history || []),
    },
    {
      headers: {
        "Cache-Control": "private, max-age=1",
      },
    }
  );
}
