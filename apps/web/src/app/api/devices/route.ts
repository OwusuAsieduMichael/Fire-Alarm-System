import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapDevice, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

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
