import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  tickSimulator();

  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  const acknowledged = url.searchParams.get("acknowledged");
  const limit = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("limit") || 50))
  );

  const store = getStore();
  let alerts = [...store.alerts];
  if (deviceId) alerts = alerts.filter((a) => a.deviceId === deviceId);
  if (acknowledged !== null && acknowledged !== undefined && acknowledged !== "") {
    const flag = acknowledged === "true";
    alerts = alerts.filter((a) => a.acknowledged === flag);
  }

  const devices = new Map(store.devices.map((d) => [d.id, d]));
  return json(
    alerts.slice(0, limit).map((a) => ({
      ...a,
      device: devices.get(a.deviceId)
        ? {
            id: devices.get(a.deviceId)!.id,
            name: devices.get(a.deviceId)!.name,
          }
        : undefined,
    }))
  );
}
