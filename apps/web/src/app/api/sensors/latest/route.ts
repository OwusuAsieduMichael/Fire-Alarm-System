import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapReading, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: devices } = await db
    .from("devices")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  const deviceId = devices?.[0]?.id;
  if (!deviceId) return json(null);

  const { data, error: readingError } = await db
    .from("sensor_readings")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (readingError) return error(readingError.message, 500);
  return json(data ? mapReading(data) : null);
}
