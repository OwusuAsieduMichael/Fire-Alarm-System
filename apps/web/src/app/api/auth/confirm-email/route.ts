import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { rateLimit } from "@/server/rate-limit";

/**
 * Presentation helper: confirm a user's email with the service role so
 * valid credentials can reach the dashboard without waiting on inbox links.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY. Disable / remove after the demo if needed.
 */
export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const limited = rateLimit(`confirm-email:${ip}`, 10, 60_000);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Presentation confirm requires SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  // Paginate a bit — presentation accounts are few; keep it simple.
  let userId: string | null = null;
  for (let page = 1; page <= 5 && !userId; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (match) userId = match.id;
    if (data.users.length < 200) break;
  }

  if (!userId) {
    return NextResponse.json(
      { error: "No account found for that email." },
      { status: 404 }
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(
    userId,
    { email_confirm: true }
  );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, confirmed: true });
}
