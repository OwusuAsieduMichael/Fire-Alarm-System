import { error, isResponse, json, requireUser } from "@/server/http";
import { getStore } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const gas = await withGas(req, `/devices/${id}/logs`);
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  const store = getStore();
  if (!store.devices.some((d) => d.id === id)) {
    return error("Device not found", 404);
  }
  return json(store.logs.filter((l) => l.deviceId === id).slice(0, 50));
}
