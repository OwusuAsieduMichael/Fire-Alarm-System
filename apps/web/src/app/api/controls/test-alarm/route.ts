import { error, isResponse, json, requireUser } from "@/server/http";
import { enqueueControl } from "@/server/iot";

export const runtime = "nodejs";

async function control(
  req: Request,
  action: Parameters<typeof enqueueControl>[0]
) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  const result = await enqueueControl(action);
  if (!result.ok) return error(result.message, result.status);
  return json(result);
}

export async function POST(req: Request) {
  return control(req, "test-alarm");
}
