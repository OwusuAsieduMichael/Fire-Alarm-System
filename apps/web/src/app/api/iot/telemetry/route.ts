import { error, json } from "@/server/http";
import { ingestTelemetry, pullCommands } from "@/server/iot";

export const runtime = "nodejs";

/**
 * ESP32 telemetry ingest (no user JWT).
 * Header: x-device-key: FG-ESP32-...
 * Body: { smokeLevel, flameDetected, temperature?, humidity?, ... }
 */
export async function POST(req: Request) {
  const deviceKey =
    req.headers.get("x-device-key") ||
    req.headers.get("X-Device-Key") ||
    "";

  const body = (await req.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;

  if (!body || typeof body !== "object") {
    return error("Invalid JSON body", 400);
  }

  const key =
    deviceKey ||
    (typeof body.deviceKey === "string" ? body.deviceKey : "");

  if (!key) {
    return error("Missing device key (x-device-key header or deviceKey)", 401);
  }

  if (typeof body.smokeLevel !== "number") {
    return error("smokeLevel (number) is required", 400);
  }

  const result = await ingestTelemetry({
    deviceKey: key,
    smokeLevel: body.smokeLevel,
    flameDetected: Boolean(body.flameDetected),
    temperature:
      typeof body.temperature === "number" ? body.temperature : null,
    humidity: typeof body.humidity === "number" ? body.humidity : null,
    buzzerActive:
      typeof body.buzzerActive === "boolean" ? body.buzzerActive : undefined,
    ledStatus: typeof body.ledStatus === "string" ? body.ledStatus : undefined,
    alarmActive:
      typeof body.alarmActive === "boolean" ? body.alarmActive : undefined,
    lcdMessage:
      typeof body.lcdMessage === "string" ? body.lcdMessage : undefined,
    wifiSsid: typeof body.wifiSsid === "string" ? body.wifiSsid : undefined,
    ipAddress: typeof body.ipAddress === "string" ? body.ipAddress : undefined,
    firmwareVersion:
      typeof body.firmwareVersion === "string"
        ? body.firmwareVersion
        : undefined,
  });

  if (!result.ok) return error(result.message, result.status);
  return json(result);
}

/** ESP32 pulls queued control commands. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceKey =
    req.headers.get("x-device-key") ||
    url.searchParams.get("deviceKey") ||
    "";

  if (!deviceKey) {
    return error("Missing device key", 401);
  }

  const result = await pullCommands(deviceKey);
  if (!result.ok) return error(result.message, result.status);
  return json(result);
}
