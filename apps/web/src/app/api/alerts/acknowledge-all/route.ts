import { isResponse, json, requireUser } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await requireUser(req);
  if (isResponse(user)) return user;
  const url = new URL(req.url);
  const deviceId = url.searchParams.get("deviceId");
  const store = getStore();
  let count = 0;
  for (const alert of store.alerts) {
    if (deviceId && alert.deviceId !== deviceId) continue;
    if (!alert.acknowledged) {
      alert.acknowledged = true;
      count += 1;
    }
  }
  return json({ success: true, count });
}
