import { isResponse, json, requireUser } from "@/server/http";
import { applyControl } from "@/server/store";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gas = await withGas(req, "/controls/reset-alarm");
  if (gas) return gas;

  const user = requireUser(req);
  if (isResponse(user)) return user;
  return json(applyControl("reset-alarm"));
}
