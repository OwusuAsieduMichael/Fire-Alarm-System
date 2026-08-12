import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { isTeamAllowedEmail } from "@/lib/team-allowlist";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { userDb } from "@/server/supabase-data";
import type { TeamMessage } from "@/types";

export const runtime = "nodejs";

type ProfileLite = { id: string; name: string; email: string };
type LedStatus = "green" | "red" | "amber";

function mapMessage(
  row: { id: string; sender_id: string; body: string; created_at: string },
  sender?: ProfileLite | null
): TeamMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: sender?.name || "Team member",
    senderEmail: sender?.email || "",
    body: row.body,
    createdAt: row.created_at,
  };
}

async function readTeamStatus(
  db: NonNullable<ReturnType<typeof userDb>>
): Promise<{ ledStatus: LedStatus; ledUpdatedAt: string | null }> {
  const { data } = await db
    .from("team_status")
    .select("led_status, updated_at")
    .eq("id", 1)
    .maybeSingle();
  const led = data?.led_status;
  const ledStatus: LedStatus =
    led === "red" || led === "amber" || led === "green" ? led : "green";
  return {
    ledStatus,
    ledUpdatedAt: data?.updated_at ?? null,
  };
}

async function setLedStatus(
  db: NonNullable<ReturnType<typeof userDb>>,
  led: LedStatus
): Promise<string> {
  const admin = createSupabaseAdminClient();
  const client = admin ?? db;
  const updatedAt = new Date().toISOString();
  await client.from("team_status").upsert({
    id: 1,
    led_status: led,
    updated_at: updatedAt,
  });
  return updatedAt;
}

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  if (!isTeamAllowedEmail(user.email)) {
    return error("Team messaging is only available to assigned operators.", 403);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const limit = Math.min(
    Number(new URL(req.url).searchParams.get("limit") || 50),
    100
  );

  const { data, error: listError } = await db
    .from("team_messages")
    .select("id, sender_id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (listError) {
    return error(
      listError.message.includes("team_messages")
        ? "Team messages table is missing. Run supabase/team-messages.sql in Supabase."
        : listError.message,
      500
    );
  }

  const senderIds = [...new Set((data || []).map((row) => row.sender_id))];
  const profilesById = new Map<string, ProfileLite>();

  if (senderIds.length > 0) {
    const admin = createSupabaseAdminClient();
    const profileClient = admin ?? db;
    const { data: profiles } = await profileClient
      .from("profiles")
      .select("id, name, email")
      .in("id", senderIds);

    for (const profile of profiles || []) {
      profilesById.set(profile.id, profile);
    }
  }

  const { ledStatus, ledUpdatedAt } = await readTeamStatus(db);

  return json({
    messages: (data || []).map((row) =>
      mapMessage(row, profilesById.get(row.sender_id))
    ),
    ledStatus,
    ledUpdatedAt,
  });
}

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  if (!isTeamAllowedEmail(user.email)) {
    return error("Only assigned team members can send messages.", 403);
  }

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const body = (await req.json().catch(() => null)) as { message?: string } | null;
  const message = body?.message?.trim() || "";

  if (!message) return error("Message is required", 400);
  if (message.length > 2000) {
    return error("Message must be 2000 characters or fewer", 400);
  }

  const { data, error: insertError } = await db
    .from("team_messages")
    .insert({
      sender_id: user.id,
      body: message,
    })
    .select("id, sender_id, body, created_at")
    .single();

  if (insertError || !data) {
    return error(
      insertError?.message?.includes("team_messages")
        ? "Team messages table is missing. Run supabase/team-messages.sql in Supabase."
        : insertError?.message || "Could not send message",
      500
    );
  }

  const ledUpdatedAt = await setLedStatus(db, "red");

  return json(
    {
      message: mapMessage(data, {
        id: user.id,
        name: user.name,
        email: user.email,
      }),
      ledStatus: "red" as const,
      ledUpdatedAt,
    },
    201
  );
}
