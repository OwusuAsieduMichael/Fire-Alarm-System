import { isResponse, json, requireUser } from "@/server/http";
import { applyControl } from "@/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  return json(applyControl("emergency"));
}
