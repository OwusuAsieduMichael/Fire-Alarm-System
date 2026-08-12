import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import {
  isTeamAllowedEmail,
  TEAM_SIGNUP_DENIED_MESSAGE,
} from "@/lib/team-allowlist";

export const runtime = "nodejs";

/**
 * Presentation-friendly signup: create a confirmed user with the service role
 * so Supabase never sends a confirmation email / hits resend limits.
 * Only allowlisted team emails may register.
 */
export async function POST(request: Request) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Signup unlock requires SUPABASE_SERVICE_ROLE_KEY on the server.",
      },
      { status: 503 }
    );
  }

  let body: {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password?.trim();
  const fullName = body.fullName?.trim() || email?.split("@")[0] || "User";
  const phone = body.phone?.trim() || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!isTeamAllowedEmail(email)) {
    return NextResponse.json(
      { error: TEAM_SIGNUP_DENIED_MESSAGE },
      { status: 403 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const meta = {
    name: fullName,
    full_name: fullName,
    phone,
    sms: phone,
  };

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: meta,
  });

  let userId = created.data.user?.id ?? null;

  if (created.error || !userId) {
    const message = created.error?.message?.toLowerCase() ?? "";
    const alreadyExists =
      message.includes("already") ||
      message.includes("registered") ||
      message.includes("exists");

    if (!alreadyExists) {
      return NextResponse.json(
        { error: created.error?.message || "Could not create account." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "An account with this email already exists. Please log in." },
      { status: 409 }
    );
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      name: fullName,
      phone: phone || null,
      role: "USER",
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Optional smoke-check: credentials work before the browser logs in.
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (url && anon) {
    const authClient = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await authClient.auth.signInWithPassword({ email, password }).catch(() => null);
  }

  return NextResponse.json({
    ok: true,
    email,
    userId,
  });
}
