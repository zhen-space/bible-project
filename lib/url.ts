// lib/url.ts
export function getBaseUrl() {
  // 1) 你手動指定（最穩）
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) return site.replace(/\/$/, "");

  // 2) Vercel 自帶（沒有 protocol）
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;

  // 3) 本機 fallback
  return "http://127.0.0.1:3010";
}