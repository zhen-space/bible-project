// lib/url.ts
import { headers } from "next/headers";

export function getBaseUrl() {
  // 在 server component / route handler 裡組出絕對網址
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3010";
  return `${proto}://${host}`;
}