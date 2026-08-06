import { json } from "@/server/http";
import { withGas } from "@/server/with-gas";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const gas = await withGas(req, "/auth/forgot-password");
  if (gas) return gas;
  return json({
    message:
      "If an account exists for that email, password reset instructions have been sent.",
  });
}
