import { error, isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  tickSimulator();
  const store = getStore();
  const device = store.devices.find((d) => d.id === id);
  if (!device) return error("Device not found", 404);
  return json({
    ...device,
    connectionLogs: store.logs.filter((l) => l.deviceId === id).slice(0, 20),
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  if (user.role !== "DEVELOPER") return error("Insufficient permissions", 403);

  const store = getStore();
  const device = store.devices.find((d) => d.id === id);
  if (!device) return error("Device not found", 404);

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    wifiSsid?: string;
    smokeThreshold?: number;
    smokeCalibration?: number;
  };

  if (typeof body.name === "string") device.name = body.name;
  if (typeof body.wifiSsid === "string") device.wifiSsid = body.wifiSsid;
  if (typeof body.smokeThreshold === "number") {
    device.smokeThreshold = body.smokeThreshold;
  }
  if (typeof body.smokeCalibration === "number") {
    device.smokeCalibration = body.smokeCalibration;
  }

  return json(device);
}
