import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapLog, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: logs, error: logsError } = await db
    .from("connection_logs")
    .select("*")
    .eq("device_id", id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (logsError) return error(logsError.message, 500);
  return json((logs || []).map(mapLog));
}
