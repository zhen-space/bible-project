import { headers } from "next/headers";

/**
 * Next.js 16：headers() 在某些環境是 async，需要 await
 * 這個 baseUrl 用來在 server component / route handler 組出「目前網站」的絕對網址
 */
export async function getBaseUrl() {
  const h = await headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.VERCEL_URL ??
    "localhost:3010";

  // VERCEL_URL 可能只給 host，不帶 proto
  const hostOnly = host.startsWith("http") ? new URL(host).host : host;

  return `${proto}://${hostOnly}`;
}