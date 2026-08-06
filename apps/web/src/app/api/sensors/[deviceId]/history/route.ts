import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapReading, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ deviceId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { deviceId } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 60), 200);

  const { data, error: historyError } = await db
    .from("sensor_readings")
    .select("*")
    .eq("device_id", deviceId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (historyError) return error(historyError.message, 500);
  return json((data || []).map(mapReading));
}
