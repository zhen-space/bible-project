import { headers } from "next/headers";

/**
 * 取得目前 request 的完整 base URL
 * (for server component / route handler)
 */
export async function getBaseUrl() {
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    "localhost:3010";

  return `${proto}://${host}`;
}