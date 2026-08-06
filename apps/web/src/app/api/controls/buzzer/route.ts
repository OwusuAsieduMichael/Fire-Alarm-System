import { error, isResponse, json, requireUser } from "@/server/http";
import { enqueueControl } from "@/server/iot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;

  const body = (await req.json().catch(() => ({}))) as { on?: boolean };
  const result = await enqueueControl(body.on ? "buzzer-on" : "buzzer-off");
  if (!result.ok) return error(result.message, result.status);
  return json(result);
}
