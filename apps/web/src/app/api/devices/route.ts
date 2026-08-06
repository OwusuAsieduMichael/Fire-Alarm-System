import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const gas = await withGas(req, "/devices");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  tickSimulator();
  const store = getStore();
  return json(
    store.devices.map((d) => ({
      ...d,
      _count: {
        alerts: store.alerts.filter((a) => a.deviceId === d.id).length,
        sensorReadings: store.readings.filter((r) => r.deviceId === d.id).length,
      },
    }))
  );
}
