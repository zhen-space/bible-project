"use client";

import { useEffect, useMemo, useState } from "react";

type Verse = {
  id: number;
  book_id: number;
  chapter_number: number;
  verse_number: number;
  text_zh: string | null;
};

type Note = {
  id: number;
  book_id: number;
  chapter_number: number;
  verse_number: number;
  content: string;
  created_at?: string | null;

  // 由 /api/notes 回來的欄位
  stars_count?: number;
  starred_by_me?: boolean;
};

export default function ChapterClient({
  bookId,
  chapterNumber,
  verses,
}: {
  bookId: string;
  chapterNumber: string;
  verses: Verse[];
}) {
  // ✅ 先求能用：暫時用固定 userId；之後你做登入再換成真 userId
  const userId = "me";

  // ✅ 只有你知道的管理暗號（.env.local 的 NEXT_PUBLIC_ADMIN_KEY）
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY ?? "";
  const [isAdmin, setIsAdmin] = useState(false);

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    // 你想更嚴格可改成 prompt，先用最簡單：有 key 就當管理者
    setIsAdmin(Boolean(adminKey));
  }, [adminKey]);

  async function loadNotes() {
    const res = await fetch(
      `/api/notes?bookId=${encodeURIComponent(bookId)}&chapterNumber=${encodeURIComponent(
        chapterNumber
      )}&userId=${encodeURIComponent(userId)}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    if (json.ok) setNotes(json.data ?? []);
  }

  useEffect(() => {
    loadNotes();
  }, [bookId, chapterNumber]);

  const notesMap = useMemo(() => {
    const map = new Map<number, Note[]>();
    for (const n of notes) {
      const arr = map.get(n.verse_number) ?? [];
      arr.push(n);
      map.set(n.verse_number, arr);
    }

    // ✅ 每節內也依星數排序（星多在前）
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => (b.stars_count ?? 0) - (a.stars_count ?? 0));
      map.set(k, arr);
    }
    return map;
  }, [notes]);

  async function addNote(verseNumber: number) {
    if (!draft.trim()) return;

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        bookId: Number(bookId),
        chapterNumber: Number(chapterNumber),
        verseNumber,
        content: draft,
      }),
    });

    const json = await res.json();
    if (json.ok) {
      setDraft("");
      await loadNotes(); // ✅ 重新抓，讓 stars_count/starred_by_me 也正確
    } else {
      alert(json.error ?? "新增失敗");
    }
  }

  async function toggleStar(noteId: number) {
    const res = await fetch(`/api/notes/${noteId}/star`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ userId }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(json.error ?? "點星失敗");
      return;
    }

    // ✅ 更新前端：把這則 note 的 starred / stars_count 更新
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId
          ? {
              ...n,
              starred_by_me: json.starred,
              stars_count: json.stars_count,
            }
          : n
      )
    );
  }

  async function deleteNote(noteId: number) {
    if (!isAdmin) return;
    if (!confirm("確定要刪除這則註釋？")) return;

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "x-admin-key": adminKey,
      },
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      alert(json.error ?? "刪除失敗");
      return;
    }

    // ✅ 立即從畫面移除（最有感）
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  return (
    <section style={{ marginTop: 24 }}>
      <ol style={{ paddingLeft: 20 }}>
        {verses.map((v) => {
          const verseNotes = notesMap.get(v.verse_number) ?? [];
          const isOpen = selectedVerse === v.verse_number;

          return (
            <li key={v.id} style={{ marginBottom: 16 }}>
              <div
                onClick={() => setSelectedVerse(isOpen ? null : v.verse_number)}
                style={{
                  cursor: "pointer",
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: isOpen ? "#f5f5f5" : "transparent",
                }}
              >
                <strong style={{ marginRight: 6 }}>{v.verse_number}.</strong>
                {v.text_zh}
                <span style={{ float: "right", color: "#888" }}>💬 {verseNotes.length}</span>
              </div>

              {isOpen && (
                <div
                  style={{
                    marginTop: 10,
                    padding: 12,
                    border: "1px solid #eee",
                    borderRadius: 10,
                    background: "#fafafa",
                  }}
                >
                  {verseNotes.length === 0 && (
                    <div style={{ color: "#888", marginBottom: 10 }}>目前沒有註釋</div>
                  )}

                  {verseNotes.map((n) => {
                    const starred = Boolean(n.starred_by_me);
                    const count = Number(n.stars_count ?? 0);

                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: "10px 10px",
                          border: "1px solid #e6e6e6",
                          borderRadius: 10,
                          background: "white",
                          marginBottom: 10,
                        }}
                      >
                        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                          {/* ☆ / ★ */}
                          <button
                            onClick={() => toggleStar(n.id)}
                            style={{
                              border: "1px solid #ddd",
                              background: "white",
                              borderRadius: 10,
                              padding: "6px 10px",
                              cursor: "pointer",
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                            title="點星（喜歡的會排前面）"
                          >
                            <span style={{ color: starred ? "#f5b301" : "#111" }}>
                              {starred ? "★" : "☆"}
                            </span>{" "}
                            {count}
                          </button>

                          <div style={{ flex: 1 }}>{n.content}</div>

                          {/* 刪除（只有你） */}
                          {isAdmin && (
                            <button
                              onClick={() => deleteNote(n.id)}
                              style={{
                                border: "1px solid #f2c0c0",
                                background: "#fff",
                                borderRadius: 10,
                                padding: "6px 10px",
                                cursor: "pointer",
                              }}
                              title="刪除（只有管理者）"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="新增註釋..."
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: 8,
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  />

                  <button
                    onClick={() => addNote(v.verse_number)}
                    style={{
                      marginTop: 8,
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      background: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    儲存註釋
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}