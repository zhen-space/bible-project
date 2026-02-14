import Link from "next/link";
import ChapterClient from "./ChapterClient";
import { getBaseUrl } from "@/lib/url";

type Verse = {
  id: number;
  book_id: number;
  chapter_number: number;
  verse_number: number;
  text_zh: string | null;
  text_en: string | null;
};

async function getVerses(bookId: string, chapterNumber: string) {
  const base = getBaseUrl();
  const url = `${base}/api/verses?bookId=${encodeURIComponent(
    bookId
  )}&chapterNumber=${encodeURIComponent(chapterNumber)}`;

  const res = await fetch(url, { cache: "no-store" });
  const json = await res.json();
  return json as { ok: boolean; data: Verse[]; error?: string };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterNumber: string }>;
}) {
  const { bookId, chapterNumber } = await params;

  const versesRes = await getVerses(bookId, chapterNumber);
  const verses = versesRes.ok ? versesRes.data : [];

  return (
    <main
      style={{
        maxWidth: 860,
        margin: "24px auto",
        padding: "0 16px",
        fontFamily: "system-ui",
      }}
    >
      <Link href="/" style={{ display: "inline-block", marginBottom: 16 }}>
        ← 回首頁
      </Link>

      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>
        創世記 (Genesis)　第 {chapterNumber} 章
      </h1>

      <div style={{ color: "#666", marginTop: 6 }}>
        目前網址：/books/{bookId}/chapters/{chapterNumber}
      </div>

      {!versesRes.ok && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            border: "1px solid #f0c",
            borderRadius: 10,
          }}
        >
          目前抓不到經文：{versesRes.error}
        </div>
      )}

      <ChapterClient bookId={bookId} chapterNumber={chapterNumber} verses={verses} />
    </main>
  );
}