import { NextResponse } from "next/server";

/**
 * Proxy browser → Next.js /api → Google Apps Script web app.
 * Avoids Apps Script CORS / Authorization-header redirect issues.
 *
 * Set GAS_SCRIPT_URL to your deployment URL, e.g.
 * https://script.google.com/macros/s/XXXX/exec
 */
export function getGasUrl(): string | null {
  const url = process.env.GAS_SCRIPT_URL?.replace(/\/$/, "");
  return url || null;
}

export function isGasEnabled(): boolean {
  return Boolean(getGasUrl());
}

export async function proxyToGas(
  req: Request,
  path: string
): Promise<NextResponse | null> {
  const gasUrl = getGasUrl();
  if (!gasUrl) return null;

  const incoming = new URL(req.url);
  const target = new URL(gasUrl);
  target.searchParams.set("path", path.startsWith("/") ? path : `/${path}`);

  // Forward useful query params (deviceId, limit, acknowledged, …)
  incoming.searchParams.forEach((value, key) => {
    if (key === "path") return;
    target.searchParams.set(key, value);
  });

  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";

  if (token) {
    target.searchParams.set("token", token);
  }

  const method = req.method.toUpperCase();
  let body: Record<string, unknown> | undefined;

  if (method !== "GET" && method !== "HEAD") {
    const text = await req.text();
    if (text) {
      try {
        body = JSON.parse(text) as Record<string, unknown>;
      } catch {
        body = { raw: text };
      }
    } else {
      body = {};
    }
    // Apps Script web apps are most reliable with POST
    body._method = method;
    body.path = path.startsWith("/") ? path : `/${path}`;
    if (token) body.token = token;
  }

  // Always POST to Apps Script except pure GETs without body needs —
  // GET is fine for read endpoints.
  const usePost = method !== "GET" && method !== "HEAD";

  const res = await fetch(target.toString(), {
    method: usePost ? "POST" : "GET",
    headers: usePost
      ? { "Content-Type": "application/json", Accept: "application/json" }
      : { Accept: "application/json" },
    body: usePost ? JSON.stringify(body ?? {}) : undefined,
    redirect: "follow",
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({
    message: "Invalid response from Google Apps Script",
  }));

  const status =
    typeof data === "object" &&
    data &&
    "statusCode" in data &&
    typeof (data as { statusCode: unknown }).statusCode === "number"
      ? (data as { statusCode: number }).statusCode
      : res.ok
        ? 200
        : res.status || 502;

  return NextResponse.json(data, { status });
}
