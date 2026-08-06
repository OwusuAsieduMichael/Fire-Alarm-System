import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ deviceId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { deviceId } = await ctx.params;
  const gas = await withGas(req, `/sensors/${deviceId}/history`);
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  tickSimulator();

  const url = new URL(req.url);
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") || 60))
  );
  const store = getStore();
  return json(
    store.readings.filter((r) => r.deviceId === deviceId).slice(0, limit)
  );
}
