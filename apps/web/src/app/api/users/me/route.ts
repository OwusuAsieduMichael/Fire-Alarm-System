import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { toAuthUser } from "@/server/auth";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  return json(user);
}

export async function PATCH(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string | null;
    theme?: string;
  };

  const token = getBearer(req);
  if (isSupabaseConfigured() && token) {
    const client = createSupabaseServerClient(token);
    if (client) {
      const patch: {
        name?: string;
        phone?: string | null;
        theme?: string;
      } = {};
      if (typeof body.name === "string" && body.name.trim()) {
        patch.name = body.name.trim();
      }
      if (body.phone !== undefined) patch.phone = body.phone;
      if (typeof body.theme === "string") patch.theme = body.theme;

      const { data, error: updateError } = await client
        .from("profiles")
        .update(patch)
        .eq("id", user.id)
        .select("*")
        .maybeSingle();

      if (updateError) return error(updateError.message, 400);
      if (!data) return error("User not found", 404);

      return json({
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role,
        theme: data.theme,
        phone: data.phone,
      });
    }
  }

  const store = getStore();
  const full = store.users.find((u) => u.id === user.id);
  if (!full) return error("User not found", 404);

  if (typeof body.name === "string" && body.name.trim()) full.name = body.name.trim();
  if (body.phone !== undefined) full.phone = body.phone;
  if (typeof body.theme === "string") full.theme = body.theme;

  return json(toAuthUser(full));
}
