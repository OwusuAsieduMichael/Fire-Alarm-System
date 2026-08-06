import { toAuthUser } from "@/server/auth";
import { error, isResponse, json, requireUser } from "@/server/http";
import { getStore } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gas = await withGas(req, "/users/me");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  const full = getStore().users.find((u) => u.id === user.id);
  if (!full) return error("User not found", 404);
  return json(toAuthUser(full));
}

export async function PATCH(req: Request) {
  const gas = await withGas(req, "/users/me");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    phone?: string | null;
    theme?: string;
  };

  const store = getStore();
  const full = store.users.find((u) => u.id === user.id);
  if (!full) return error("User not found", 404);

  if (typeof body.name === "string" && body.name.trim()) full.name = body.name.trim();
  if (body.phone !== undefined) full.phone = body.phone;
  if (typeof body.theme === "string") full.theme = body.theme;

  return json(toAuthUser(full));
}
