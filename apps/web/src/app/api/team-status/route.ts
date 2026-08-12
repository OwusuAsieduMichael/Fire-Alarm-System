import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { isTeamAllowedEmail } from "@/lib/team-allowlist";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

type LedStatus = "green" | "red" | "amber";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  if (!isTeamAllowedEmail(user.email)) {
    return error("Team status is only available to assigned operators.", 403);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data } = await db
    .from("team_status")
    .select("led_status, updated_at")
    .eq("id", 1)
    .maybeSingle();

  const led = data?.led_status;
  const ledStatus: LedStatus =
    led === "red" || led === "amber" || led === "green" ? led : "green";

  return json({
    ledStatus,
    ledUpdatedAt: data?.updated_at ?? null,
  });
}

/** Reset (or set) shared team LED — green clears message-driven alert UI. */
export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  if (!isTeamAllowedEmail(user.email)) {
    return error("Only assigned team members can reset system status.", 403);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const body = (await req.json().catch(() => null)) as {
    ledStatus?: string;
  } | null;

  const requested = body?.ledStatus;
  const ledStatus: LedStatus =
    requested === "red" || requested === "amber" || requested === "green"
      ? requested
      : "green";

  const admin = createSupabaseAdminClient();
  const client = admin ?? db;
  const ledUpdatedAt = new Date().toISOString();

  const { error: upsertError } = await client.from("team_status").upsert({
    id: 1,
    led_status: ledStatus,
    updated_at: ledUpdatedAt,
  });

  if (upsertError) {
    return error(
      upsertError.message.includes("team_status")
        ? "Team status table is missing. Run supabase/patch-team-status.sql in Supabase."
        : upsertError.message,
      500
    );
  }

  return json({ ledStatus, ledUpdatedAt });
}
