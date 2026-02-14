import Link from "next/link";

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

async function getBooks(): Promise<Book[]> {
  const res = await fetch("http://127.0.0.1:3010/api/books", { cache: "no-store" });
  const json = await res.json();
  return json?.ok ? (json.data as Book[]) : [];
}

async function getChapters(bookId: number): Promise<Chapter[]> {
  const res = await fetch(`http://127.0.0.1:3010/api/chapters?bookId=${bookId}`, { cache: "no-store" });
  const json = await res.json();
  return json?.ok ? (json.data as Chapter[]) : [];
}

export default async function BooksPage() {
  const books = await getBooks();
  const chaptersByBook = await Promise.all(
    books.map(async (b) => [b.id, await getChapters(b.id)] as const)
  );
  const map = new Map<number, Chapter[]>(chaptersByBook);

  return (
    <>
      <div className="header">
        <div>
          <div className="title">聖經書卷</div>
          <div className="subtle">選一本書，再選章節</div>
        </div>
        <Link className="btn" href="/">
          回首頁
        </Link>
      </div>

      <div className="card">
        <div className="cardInner stack">
          {books.length === 0 ? (
            <div className="subtle">目前沒有書卷資料（/api/books 回傳空）。</div>
          ) : (
            books.map((book) => {
              const chs = map.get(book.id) ?? [];
              return (
                <div key={book.id} className="stack">
                  <div className="row" style={{ alignItems: "baseline" }}>
                    <div className="col">
                      <div style={{ fontWeight: 900, fontSize: 18 }}>
                        {book.order_index}. {book.name_zh} <span className="subtle">({book.name_en})</span>
                      </div>
                    </div>
                  </div>

                  <div className="pills">
                    {chs.length === 0 ? (
                      <div className="subtle">(這卷目前沒有章資料)</div>
                    ) : (
                      chs.map((c) => (
                        <Link
                          key={c.id}
                          className="pill"
                          href={`/books/${book.id}/chapters/${c.chapter_number}`}
                        >
                          <strong>第 {c.chapter_number} 章</strong>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="divider" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}