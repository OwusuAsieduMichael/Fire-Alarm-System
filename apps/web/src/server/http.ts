import { NextResponse } from "next/server";
import { toAuthUser, verifyToken } from "./auth";
import { getStore } from "./store";
import type { AuthUser } from "./types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function getBearer(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export async function requireUser(
  req: Request
): Promise<AuthUser | NextResponse> {
  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);

  if (isSupabaseConfigured()) {
    const client = createSupabaseServerClient(token);
    if (client) {
      const {
        data: { user },
        error: authError,
      } = await client.auth.getUser(token);

      if (!authError && user) {
        const { data: profile } = await client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile) {
          return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            theme: profile.theme,
            phone: profile.phone,
          };
        }

        // Profile trigger missing — still allow access with metadata fallback
        const meta = user.user_metadata ?? {};
        const name =
          (typeof meta.name === "string" && meta.name) ||
          (typeof meta.full_name === "string" && meta.full_name) ||
          user.email?.split("@")[0] ||
          "Operator";
        const phone =
          (typeof meta.phone === "string" && meta.phone) ||
          (typeof meta.sms === "string" && meta.sms) ||
          null;

        return {
          id: user.id,
          email: user.email || "",
          name,
          role: "USER",
          theme: "system",
          phone,
        };
      }
    }
  }

  // Legacy local JWT (in-memory demo API)
  const payload = verifyToken(token);
  if (!payload) return error("Unauthorized", 401);
  const local = getStore().users.find((u) => u.id === payload.sub);
  if (!local) return error("Unauthorized", 401);
  return toAuthUser(local);
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
