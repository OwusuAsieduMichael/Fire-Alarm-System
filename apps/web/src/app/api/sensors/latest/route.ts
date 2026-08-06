import { isResponse, json, requireUser } from "@/server/http";
import { getStore, tickSimulator } from "@/server/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const live = tickSimulator();
  const store = getStore();
  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId") || live.deviceId;
  const latest = store.readings.find((r) => r.deviceId === deviceId);

  if (latest) return json(latest);

  return json({
    id: "live",
    deviceId: live.deviceId,
    smokeLevel: live.smokeLevel,
    flameDetected: live.flameDetected,
    temperature: live.temperature,
    humidity: live.humidity,
    buzzerActive: live.buzzerActive,
    ledStatus: live.ledStatus,
    alarmActive: live.alarmActive,
    lcdMessage: live.lcdMessage,
    createdAt: live.lastSeen,
  });
}
