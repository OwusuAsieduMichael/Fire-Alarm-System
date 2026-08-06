import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
} from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PresentationEnv = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

function presentationEnabled() {
  return process.env.PRESENTATION_AUTH_ENABLED === "true";
}

function readPresentationEnv(): PresentationEnv | null {
  const email = process.env.PRESENTATION_AUTH_EMAIL?.trim().toLowerCase();
  const password = process.env.PRESENTATION_AUTH_PASSWORD?.trim();
  if (!email || !password) return null;

  return {
    email,
    password,
    name:
      process.env.PRESENTATION_AUTH_NAME?.trim() ||
      email.split("@")[0] ||
      "Presenter",
    phone: process.env.PRESENTATION_AUTH_PHONE?.trim() || "",
  };
}

async function findUserIdByEmail(
  admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  email: string
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw new Error(error.message);
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) break;
  }
  return null;
}

/**
 * Presentation shortcut: ensure the demo account exists with a confirmed email
 * (no inbox / resend limits), then return a session for the browser to adopt.
 *
 * Requires PRESENTATION_AUTH_ENABLED=true and PRESENTATION_AUTH_* credentials.
 * Turn off after the demo — anyone who can hit this route gets that account.
 */
export async function POST() {
  if (!presentationEnabled()) {
    return NextResponse.json(
      { error: "Presentation auth is disabled." },
      { status: 404 }
    );
  }

  const creds = readPresentationEnv();
  if (!creds) {
    return NextResponse.json(
      {
        error:
          "Set PRESENTATION_AUTH_EMAIL and PRESENTATION_AUTH_PASSWORD on the server.",
      },
      { status: 503 }
    );
  }

  const admin = createSupabaseAdminClient();
  const url = getSupabaseUrl();
  const anon = getSupabaseAnonKey();
  if (!admin || !url || !anon) {
    return NextResponse.json(
      {
        error:
          "Presentation auth requires Supabase URL, anon key, and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 }
    );
  }

  const meta = {
    name: creds.name,
    full_name: creds.name,
    phone: creds.phone,
    sms: creds.phone,
  };

  const created = await admin.auth.admin.createUser({
    email: creds.email,
    password: creds.password,
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

    if (!alreadyExists && created.error) {
      return NextResponse.json(
        { error: created.error.message },
        { status: 500 }
      );
    }

    userId = await findUserIdByEmail(admin, creds.email);
    if (!userId) {
      return NextResponse.json(
        { error: created.error?.message || "Could not create presentation user." },
        { status: 500 }
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      userId,
      {
        password: creds.password,
        email_confirm: true,
        user_metadata: meta,
      }
    );
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  // Keep profile usable even if the Auth trigger lagged.
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      email: creds.email,
      name: creds.name,
      phone: creds.phone || null,
      role: "USER",
    },
    { onConflict: "id" }
  );
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const authClient = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: signedIn, error: signInError } =
    await authClient.auth.signInWithPassword({
      email: creds.email,
      password: creds.password,
    });

  if (signInError || !signedIn.session) {
    return NextResponse.json(
      { error: signInError?.message || "Presentation sign-in failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    email: creds.email,
    access_token: signedIn.session.access_token,
    refresh_token: signedIn.session.refresh_token,
  });
}

/** Lets the login UI know auto-enter is available without exposing secrets. */
export async function GET() {
  const enabled =
    presentationEnabled() && Boolean(readPresentationEnv()) && Boolean(createSupabaseAdminClient());

  return NextResponse.json({
    enabled,
    autoLogin: enabled && process.env.NEXT_PUBLIC_PRESENTATION_AUTO_LOGIN === "true",
  });
}
