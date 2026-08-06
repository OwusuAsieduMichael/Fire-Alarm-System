import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { error: updateError } = await db
    .from("alerts")
    .update({ acknowledged: true })
    .eq("acknowledged", false);

  if (updateError) return error(updateError.message, 400);
  return json({ success: true });
}
