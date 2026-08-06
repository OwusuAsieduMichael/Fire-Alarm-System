import { toAuthUser } from "@/server/auth";
import { error, isResponse, json, requireUser } from "@/server/http";
import { getStore } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gas = await withGas(req, "/auth/me");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  const full = getStore().users.find((u) => u.id === user.id);
  if (!full) return error("User not found", 404);
  return json(toAuthUser(full));
}
