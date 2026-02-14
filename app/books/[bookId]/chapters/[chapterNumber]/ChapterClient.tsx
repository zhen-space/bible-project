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

  // ✅ 你的 API 回的是這兩個欄位
  stars_count?: number | null;
  starred_by_me?: boolean | null;
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
  // 你目前用 userId="me" 測試星號：這裡直接固定成 me（之後再做登入/匿名）
  const userId = "me";

  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [adminKey, setAdminKey] = useState<string>(""); // 只有有管理者 key 才顯示刪除鍵

  // 讀管理者 key（你可在 login 頁把它存到 localStorage: adminKey）
  useEffect(() => {
    try {
      const k = localStorage.getItem("adminKey") ?? "";
      setAdminKey(k);
    } catch {}
  }, []);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterNumber]);

  // 依 verse 分組 + 排序：星數多的在前，星數相同則新到舊
  const notesMap = useMemo(() => {
    const map = new Map<number, Note[]>();

    for (const n of notes) {
      const arr = map.get(n.verse_number) ?? [];
      arr.push(n);
      map.set(n.verse_number, arr);
    }

    for (const [vn, arr] of map.entries()) {
      arr.sort((a, b) => {
        const sa = Number(a.stars_count ?? 0);
        const sb = Number(b.stars_count ?? 0);
        if (sb !== sa) return sb - sa;

        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
      map.set(vn, arr);
    }

    return map;
  }, [notes]);

  async function addNote(verseNumber: number) {
    if (!draft.trim()) return;

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookId: Number(bookId),
        chapterNumber: Number(chapterNumber),
        verseNumber,
        content: draft.trim(),
      }),
    });

    const json = await res.json();
    if (json.ok) {
      // 新增後你後端回的可能沒有 stars_count / starred_by_me，所以保守補上
      const row: Note = {
        ...json.data,
        stars_count: json.data?.stars_count ?? 0,
        starred_by_me: json.data?.starred_by_me ?? false,
      };
      setNotes((prev) => [...prev, row]);
      setDraft("");
    }
  }

  async function toggleStar(noteId: number) {
    const res = await fetch(`/api/notes/${noteId}/star`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });

    const json = await res.json();
    if (!json.ok) {
      alert(`點星失敗：${json.error ?? "unknown"}`);
      return;
    }

    const starred = Boolean(json.starred);
    const starsCount = Number(json.stars_count ?? 0);

    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, starred_by_me: starred, stars_count: starsCount } : n
      )
    );
  }

  async function deleteNote(noteId: number) {
    if (!adminKey) return;

    const ok = confirm("確定要刪除這則註釋嗎？");
    if (!ok) return;

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "x-admin-key": adminKey,
      },
    });

    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.ok) {
      alert(`刪除失敗：${json?.error ?? res.statusText}`);
      return;
    }

    // 先前端移除（立刻有感）
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
                          marginBottom: 10,
                          padding: "10px 10px",
                          border: "1px solid #e6e6e6",
                          borderRadius: 10,
                          background: "#fff",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {/* ☆ / ★：你要的「空心框」→ ☆；點了變黃 ★ */}
                          <button
                            onClick={() => toggleStar(n.id)}
                            title="喜歡（點星）"
                            style={{
                              border: "1px solid #ddd",
                              background: "#fff",
                              borderRadius: 10,
                              padding: "4px 10px",
                              cursor: "pointer",
                              fontSize: 16,
                              lineHeight: "18px",
                            }}
                          >
                            <span style={{ color: starred ? "#f4b400" : "#111" }}>
                              {starred ? "★" : "☆"}
                            </span>{" "}
                            <span style={{ color: "#666", fontSize: 13 }}>{count}</span>
                          </button>

                          {/* 內容 */}
                          <div style={{ flex: 1 }}>{n.content}</div>

                          {/* 刪除（只有你：要有 adminKey 才顯示） */}
                          {adminKey && (
                            <button
                              onClick={() => deleteNote(n.id)}
                              title="刪除（只有管理者）"
                              style={{
                                border: "1px solid #ddd",
                                background: "#fff",
                                borderRadius: 10,
                                padding: "4px 10px",
                                cursor: "pointer",
                              }}
                            >
                              🗑
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