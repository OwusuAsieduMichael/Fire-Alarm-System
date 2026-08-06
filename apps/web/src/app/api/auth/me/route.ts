import { isResponse, json, requireUser } from "@/server/http";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  return json(user);
}
