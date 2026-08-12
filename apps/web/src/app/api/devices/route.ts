import { randomBytes } from "crypto";
import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapDevice, userDb } from "@/server/supabase-data";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

function newDeviceKey() {
  return `FG-ESP32-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: devices, error: devicesError } = await db
    .from("devices")
    .select("*")
    .order("created_at", { ascending: true });

  if (devicesError) return error(devicesError.message, 500);

  const rows = devices || [];
  const mapped = await Promise.all(
    rows.map(async (row) => {
      const [{ count: alertCount }, { count: readingCount }] = await Promise.all([
        db
          .from("alerts")
          .select("*", { count: "exact", head: true })
          .eq("device_id", row.id),
        db
          .from("sensor_readings")
          .select("*", { count: "exact", head: true })
          .eq("device_id", row.id),
      ]);
      return mapDevice(row, {
        alerts: alertCount ?? 0,
        readings: readingCount ?? 0,
      });
    })
  );

  return json(mapped);
}

/** Any signed-in user can register their own ESP32 device. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const limited = rateLimit(`device-create:${user.id}`, 10, 60_000);
  if (!limited.ok) {
    return error(`Too many devices created. Retry in ${limited.retryAfterSec}s`, 429);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    smokeThreshold?: number;
  };

  const name =
    typeof body.name === "string" && body.name.trim()
      ? body.name.trim()
      : "FireGuard Sensor";

  const deviceKey = newDeviceKey();
  const { data, error: insertError } = await db
    .from("devices")
    .insert({
      owner_id: user.id,
      name,
      device_key: deviceKey,
      status: "OFFLINE",
      smoke_threshold:
        typeof body.smokeThreshold === "number" ? body.smokeThreshold : 60,
      flame_threshold:
        typeof body.flameThreshold === "number" ? body.flameThreshold : 1000,
      smoke_calibration: 0,
      firmware_version: "pending",
    })
    .select("*")
    .single();

  if (insertError) return error(insertError.message, 400);

  await db.from("device_members").insert({
    device_id: data.id,
    user_id: user.id,
    member_role: "OWNER",
  });

  return json(mapDevice(data), 201);
}
