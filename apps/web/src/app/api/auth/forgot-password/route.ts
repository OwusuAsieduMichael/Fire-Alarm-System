import { json } from "@/server/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  return json({
    message:
      "If an account exists for that email, password reset instructions have been sent.",
  });
}
