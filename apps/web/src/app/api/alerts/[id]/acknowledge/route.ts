import { error, isResponse, json, requireUser } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  const alert = getStore().alerts.find((a) => a.id === id);
  if (!alert) return error("Alert not found", 404);
  alert.acknowledged = true;
  return json(alert);
}
