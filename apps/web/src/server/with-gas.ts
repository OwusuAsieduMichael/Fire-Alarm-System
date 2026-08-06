import type { NextResponse } from "next/server";
import { proxyToGas } from "./gas-proxy";

/** If GAS_SCRIPT_URL is set, proxy; otherwise return null so local handler runs. */
export async function withGas(
  req: Request,
  path: string
): Promise<NextResponse | null> {
  return proxyToGas(req, path);
}
