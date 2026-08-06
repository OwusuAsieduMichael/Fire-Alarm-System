import { getBearer, error, isResponse, json, requireUser } from "@/server/http";
import { enqueueControl, type ControlAction } from "@/server/iot";
import { rateLimit } from "@/server/rate-limit";

export const runtime = "nodejs";

async function control(req: Request, action: ControlAction) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const limited = rateLimit(`control:${user.id}`, 30, 60_000);
  if (!limited.ok) {
    return error(`Too many control requests. Retry in ${limited.retryAfterSec}s`, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { deviceId?: string };
  const token = getBearer(req);
  const result = await enqueueControl(action, body.deviceId, {
    userId: user.id,
    accessToken: token,
  });
  if (!result.ok) return error(result.message, result.status);
  return json(result);
}

export async function POST(req: Request) {
  return control(req, "test-alarm");
}
