import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

export default async function Home() {
  const { data: books, error: booksError } = await supabase
    .from("books")
    .select("id, name_zh, name_en, order_index")
    .order("order_index", { ascending: true });

  const { data: chapters, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, book_id, chapter_number")
    .order("book_id", { ascending: true })
    .order("chapter_number", { ascending: true });

  if (booksError || chaptersError) {
    return (
      <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui" }}>
        <h1>資料讀取失敗</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>
          {JSON.stringify(
            {
              booksError: booksError?.message ?? null,
              chaptersError: chaptersError?.message ?? null,
            },
            null,
            2
          )}
        </pre>
      </main>
    );
  }

  const chaptersByBookId =
    (chapters ?? []).reduce<Record<number, Chapter[]>>((acc, c) => {
      (acc[c.book_id] ??= []).push(c);
      return acc;
    }, {});

  return (
    <main style={{ maxWidth: 860, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 8 }}>聖經書卷</h1>
      <div style={{ color: "#666", marginBottom: 24 }}>
        ✅ OK : books {(books ?? []).length} rows / chapters {(chapters ?? []).length} rows
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        {(books ?? []).map((book) => {
          const bookChapters = (chaptersByBookId[book.id] ?? []).slice();

          return (
            <section
              key={book.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 12,
                padding: 16,
                background: "white",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>
                {book.order_index}. {book.name_zh}{" "}
                <span style={{ color: "#666", fontWeight: 500 }}>({book.name_en})</span>
              </div>

              {bookChapters.length === 0 ? (
                <div style={{ color: "#666" }}>(這卷目前沒有章資料)</div>
              ) : (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {bookChapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/books/${book.id}/chapters/${chapter.chapter_number}`}
                      style={{
                        display: "inline-block",
                        padding: "6px 12px",
                        border: "1px solid #ccc",
                        borderRadius: 10,
                        textDecoration: "none",
                        color: "#111",
                        background: "#f5f5f5",
                      }}
                    >
                      第 {chapter.chapter_number} 章
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}