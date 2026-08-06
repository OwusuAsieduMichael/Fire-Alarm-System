import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";

export const runtime = "nodejs";

/** Live telemetry polling endpoint for the in-app simulator / local API. */
export async function GET(req: Request) {
  const user = await requireUser(req);
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
