import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapAlert, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  const limit = Math.min(
    Number(url.searchParams.get("limit") || 50),
    200
  );

  let query = db
    .from("alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (deviceId) query = query.eq("device_id", deviceId);

  const { data, error: alertsError } = await query;
  if (alertsError) return error(alertsError.message, 500);

  const { data: devices } = await db.from("devices").select("id, name");
  const nameById = new Map((devices || []).map((d) => [d.id, d.name]));

  return json(
    (data || []).map((row) => mapAlert(row, nameById.get(row.device_id)))
  );
}
