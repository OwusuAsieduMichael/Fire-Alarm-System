import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

/** Polling endpoint — proxies to Google Apps Script when GAS_SCRIPT_URL is set. */
export async function GET(req: Request) {
  const gas = await withGas(req, "/live");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  const live = tickSimulator();
  const store = getStore();
  return json({
    live,
    recentAlerts: store.alerts.slice(0, 20),
    smokeHistory: store.readings
      .slice(0, 60)
      .reverse()
      .map((r) => ({
        timestamp: r.createdAt,
        smokeLevel: r.smokeLevel,
        temperature: r.temperature,
        humidity: r.humidity,
      })),
  });
}
