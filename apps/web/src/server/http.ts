import { NextResponse } from "next/server";
import { toAuthUser, verifyToken } from "./auth";
import { getStore } from "./store";
import type { AuthUser } from "./types";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export function getBearer(req: Request): string | null {
  const header = req.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function requireUser(req: Request): AuthUser | NextResponse {
  const token = getBearer(req);
  if (!token) return error("Unauthorized", 401);
  const payload = verifyToken(token);
  if (!payload) return error("Unauthorized", 401);
  const user = getStore().users.find((u) => u.id === payload.sub);
  if (!user) return error("Unauthorized", 401);
  return toAuthUser(user);
}

export function isResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}
