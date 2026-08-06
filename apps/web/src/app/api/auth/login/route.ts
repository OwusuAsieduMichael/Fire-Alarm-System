import { toAuthUser, verifyPassword, signToken } from "@/server/auth";
import { error, json } from "@/server/http";
import { getStore } from "@/server/store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;

  if (!body?.email || !body?.password) {
    return error("Email and password are required", 400);
  }

  const user = getStore().users.find(
    (u) => u.email === body.email!.toLowerCase()
  );
  if (!user || !verifyPassword(body.password, user.passwordHash)) {
    return error("Invalid email or password", 401);
  }

  return json({
    accessToken: signToken(user),
    user: toAuthUser(user),
  });
}
