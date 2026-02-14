import Link from "next/link";
import { getBaseUrl } from "@/lib/url";

type Book = {
  id: number;
  name_zh: string;
  name_en: string;
  order_index: number;
};

type Chapter = {
  id: number;
  book_id: number;
  chapter_number: number;
};

async function getJSON<T>(path: string): Promise<T> {
  const base = getBaseUrl();
  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  return (await res.json()) as T;
}

export default async function HomePage() {
  const booksRes = await getJSON<{ ok: boolean; data: Book[]; error?: string }>(
    "/api/books"
  );
  const chaptersRes = await getJSON<{
    ok: boolean;
    data: Chapter[];
    error?: string;
  }>("/api/chapters");

  const books = booksRes.ok ? booksRes.data : [];
  const chapters = chaptersRes.ok ? chaptersRes.data : [];

  // group chapters by book_id
  const byBook = new Map<number, Chapter[]>();
  for (const ch of chapters) {
    const arr = byBook.get(ch.book_id) ?? [];
    arr.push(ch);
    byBook.set(ch.book_id, arr);
  }
  for (const [k, arr] of byBook.entries()) {
    arr.sort((a, b) => a.chapter_number - b.chapter_number);
    byBook.set(k, arr);
  }

  return (
    <main style={{ maxWidth: 860, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0, fontSize: 34, fontWeight: 800 }}>聖經書卷</h1>

      {!booksRes.ok && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f0c", borderRadius: 10 }}>
          讀取 books 失敗：{booksRes.error}
        </div>
      )}
      {!chaptersRes.ok && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #f0c", borderRadius: 10 }}>
          讀取 chapters 失敗：{chaptersRes.error}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        {books.map((book) => {
          const list = byBook.get(book.id) ?? [];
          return (
            <div key={book.id} style={{ marginBottom: 14 }}>
              <div style={{ fontWeight: 800 }}>
                {book.order_index}. {book.name_zh} ({book.name_en})
              </div>

              <div style={{ marginTop: 6 }}>
                {list.length === 0 ? (
                  <span style={{ color: "#666" }}>（這卷目前沒有章資料）</span>
                ) : (
                  list.map((ch) => (
                    <Link
                      key={ch.id}
                      href={`/books/${book.id}/chapters/${ch.chapter_number}`}
                      style={{ marginRight: 10 }}
                    >
                      第 {ch.chapter_number} 章 →
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}