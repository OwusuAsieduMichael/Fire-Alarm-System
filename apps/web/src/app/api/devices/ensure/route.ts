import { randomBytes } from "crypto";
import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapDevice, userDb } from "@/server/supabase-data";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

function newDeviceKey() {
  return `FG-ESP32-${randomBytes(4).toString("hex").toUpperCase()}`;
}

/**
 * Ensure the signed-in account has at least one ESP32 device.
 * Creates one automatically so the only remaining hardware step is flashing.
 */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: existing, error: listError } = await db
    .from("devices")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1);

  if (listError) return error(listError.message, 500);

  if (existing?.[0]) {
    return json({ created: false, device: mapDevice(existing[0]) });
  }

  const limited = rateLimit(`device-ensure:${user.id}`, 5, 60_000);
  if (!limited.ok) {
    return error(
      `Too many device provisioning attempts. Retry in ${limited.retryAfterSec}s`,
      429
    );
  }

  const deviceKey = newDeviceKey();
  const { data, error: insertError } = await db
    .from("devices")
    .insert({
      owner_id: user.id,
      name: "FireGuard Sensor",
      device_key: deviceKey,
      status: "OFFLINE",
      smoke_threshold: 300,
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

  return json({ created: true, device: mapDevice(data) }, 201);
}
