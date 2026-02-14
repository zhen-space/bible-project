import { headers } from "next/headers";

export async function getBaseUrl() {
  try {
    const h = await headers(); // ✅ Next 16 必須 await

    const proto =
      h.get("x-forwarded-proto") ??
      (process.env.NODE_ENV === "production" ? "https" : "http");

    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3010";

    return `${proto}://${host}`;
  } catch {
    // fallback（本機 or 取不到 headers）
    return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3010";
  }
}