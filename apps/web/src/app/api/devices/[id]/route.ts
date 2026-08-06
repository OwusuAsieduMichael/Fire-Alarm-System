import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { mapDevice, mapLog, userDb } from "@/server/supabase-data";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const { data: device, error: deviceError } = await db
    .from("devices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (deviceError) return error(deviceError.message, 500);
  if (!device) return error("Device not found", 404);

  const { data: logs } = await db
    .from("connection_logs")
    .select("*")
    .eq("device_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return json({
    ...mapDevice(device),
    connectionLogs: (logs || []).map(mapLog),
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  if (user.role !== "DEVELOPER") return error("Insufficient permissions", 403);

  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const db = userDb(token);
  if (!db) return error("Supabase is not configured", 503);

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    wifiSsid?: string;
    smokeThreshold?: number;
    smokeCalibration?: number;
  };

  const patch: Record<string, unknown> = {};
  if (typeof body.name === "string") patch.name = body.name;
  if (typeof body.wifiSsid === "string") patch.wifi_ssid = body.wifiSsid;
  if (typeof body.smokeThreshold === "number") {
    patch.smoke_threshold = body.smokeThreshold;
  }
  if (typeof body.smokeCalibration === "number") {
    patch.smoke_calibration = body.smokeCalibration;
  }

  // developers_update policy only allows DEVELOPER role in profiles
  const { data, error: updateError } = await db
    .from("devices")
    .update(patch)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (updateError) return error(updateError.message, 400);
  if (!data) return error("Device not found or update forbidden", 404);
  return json(mapDevice(data));
}
