import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapAlert, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data, error: updateError } = await db
    .from("alerts")
    .update({ acknowledged: true })
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError) return error(updateError.message, 400);
  if (!data) return error("Alert not found", 404);
  return json(mapAlert(data));
}
