import { error, isResponse, json, requireUser } from "@/server/http";
import { enqueueControl } from "@/server/iot";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  const result = await enqueueControl("emergency");
  if (!result.ok) return error(result.message, result.status);
  return json(result);
}
