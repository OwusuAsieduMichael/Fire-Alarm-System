import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { AuthUser, Role, UserRecord } from "./types";

const JWT_SECRET =
  process.env.JWT_SECRET || "fireguard-vercel-dev-secret-change-me";

function b64url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? "" : "=".repeat(4 - (input.length % 4));
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return Buffer.from(normalized, "base64");
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const digest = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${digest}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest) return false;
  const next = createHmac("sha256", salt).update(password).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(next));
  } catch {
    return false;
  }
}

/** Deterministic hash for seeded demo accounts */
export function seedPasswordHash(password: string, salt = "fireguard-seed"): string {
  const digest = createHmac("sha256", salt).update(password).digest("hex");
  return `${salt}:${digest}`;
}

export function signToken(user: UserRecord): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    })
  );
  const data = `${header}.${payload}`;
  const sig = b64url(createHmac("sha256", JWT_SECRET).update(data).digest());
  return `${data}.${sig}`;
}

export function verifyToken(token: string): {
  sub: string;
  email: string;
  role: Role;
} | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const data = `${header}.${payload}`;
  const expected = b64url(createHmac("sha256", JWT_SECRET).update(data).digest());
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    const body = JSON.parse(fromB64url(payload).toString("utf8")) as {
      sub: string;
      email: string;
      role: Role;
      exp?: number;
    };
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: body.sub, email: body.email, role: body.role };
  } catch {
    return null;
  }
}

export function toAuthUser(user: UserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    theme: user.theme,
    phone: user.phone,
  };
}
