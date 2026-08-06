import { error, isResponse, json, requireUser } from "@/server/http";
import { applyControl } from "@/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  const body = (await req.json().catch(() => null)) as { on?: boolean } | null;
  if (typeof body?.on !== "boolean") return error("on boolean required", 400);
  return json(applyControl(body.on ? "buzzer-on" : "buzzer-off"));
}
