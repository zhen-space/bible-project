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
  stars?: number | null; // 後端回 stars_count 或 stars 都行（我們取 stars）
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
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");

  // ⭐ 我的 userId（先用 localStorage 固定一個；之後你要改登入再換）
  const [userId, setUserId] = useState("me");

  // ✅ 管理模式（不要用網址 ?admin=1，改用 localStorage）
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    try {
      const u = localStorage.getItem("bc_userId");
      if (!u) localStorage.setItem("bc_userId", "me");
      setUserId(localStorage.getItem("bc_userId") || "me");

      const adminFlag = localStorage.getItem("bc_isAdmin");
      setIsAdmin(adminFlag === "1");
    } catch {}
  }, []);

  async function loadNotes() {
    const res = await fetch(
      `/api/notes?bookId=${bookId}&chapterNumber=${chapterNumber}&userId=${encodeURIComponent(
        userId
      )}`,
      { cache: "no-store" }
    );
    const json = await res.json();
    if (json.ok) setNotes(json.data ?? []);
  }

  useEffect(() => {
    // userId 要先 ready 才抓
    if (!userId) return;
    loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapterNumber, userId]);

  const notesMap = useMemo(() => {
    const map = new Map<number, Note[]>();

    for (const n of notes) {
      const arr = map.get(n.verse_number) ?? [];
      arr.push(n);
      map.set(n.verse_number, arr);
    }

    // ✅ 每節內：stars 多的在前；同 stars 則新到舊
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => {
        const sa = Number(a.stars ?? 0);
        const sb = Number(b.stars ?? 0);
        if (sb !== sa) return sb - sa;
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
      map.set(k, arr);
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
        content: draft,
      }),
    });

    const json = await res.json();
    if (json.ok) {
      setNotes((prev) => [...prev, json.data]);
      setDraft("");
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
      alert(json.error ?? "星號失敗");
      return;
    }

    // 後端會回：{ starred, stars_count }
    const starred = Boolean(json.starred);
    const starsCount = Number(json.stars_count ?? 0);

    // ✅ 只更新該 note 的 stars（同時靠 useMemo 排序到前面）
    setNotes((prev) =>
      prev.map((n) =>
        n.id === noteId ? { ...n, stars: starsCount } : n
      )
    );
  }

  async function deleteNote(noteId: number) {
    if (!confirm("確定刪除這則註釋？")) return;

    const adminKey = (() => {
      try {
        return localStorage.getItem("bc_admin_key") || "";
      } catch {
        return "";
      }
    })();

    if (!adminKey) {
      alert("你目前不是管理者（缺少 admin key）");
      return;
    }

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
      headers: { Accept: "application/json", "x-admin-key": adminKey },
    });

    const json = await res.json();
    if (!json.ok) {
      alert(`刪除失敗：${json.error ?? "unknown"}`);
      return;
    }

    setNotes((prev) => prev.filter((n) => n.id !== noteId));
  }

  function openAdmin() {
    const key = prompt("輸入管理者 key（只你知道）：") ?? "";
    if (!key.trim()) return;
    try {
      localStorage.setItem("bc_admin_key", key.trim());
      localStorage.setItem("bc_isAdmin", "1");
    } catch {}
    setIsAdmin(true);
    alert("✅ 管理模式已開啟（重新整理也會保留）");
  }

  function closeAdmin() {
    try {
      localStorage.removeItem("bc_admin_key");
      localStorage.setItem("bc_isAdmin", "0");
    } catch {}
    setIsAdmin(false);
    alert("已關閉管理模式");
  }

  return (
    <section style={{ marginTop: 24 }}>
      {/* 管理按鈕（不用再打 ?admin=1） */}
      <div
        style={{
          marginBottom: 12,
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
        }}
      >
        {isAdmin ? (
          <button
            onClick={closeAdmin}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            關閉管理模式
          </button>
        ) : (
          <button
            onClick={openAdmin}
            style={{
              padding: "6px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            開啟管理模式
          </button>
        )}
      </div>

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
                <span style={{ float: "right", color: "#888" }}>
                  💬 {verseNotes.length}
                </span>
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
                    <div style={{ color: "#888", marginBottom: 10 }}>
                      目前沒有註釋
                    </div>
                  )}

                  {verseNotes.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        marginBottom: 10,
                        padding: 10,
                        border: "1px solid #eee",
                        borderRadius: 10,
                        background: "#fff",
                      }}
                    >
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        {/* ☆ 空心 / ★ 變黃 */}
                        <button
                          onClick={() => toggleStar(n.id)}
                          title="星號（把喜歡的頂到前面）"
                          style={{
                            border: "1px solid #ddd",
                            background: "#fff",
                            cursor: "pointer",
                            borderRadius: 10,
                            padding: "2px 8px",
                          }}
                        >
                          ☆ <span style={{ color: "#666" }}>{Number(n.stars ?? 0)}</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => deleteNote(n.id)}
                            title="刪除（只有你）"
                            style={{
                              border: "1px solid #f2b8b5",
                              background: "#fff",
                              cursor: "pointer",
                              borderRadius: 10,
                              padding: "2px 10px",
                              color: "#b42318",
                            }}
                          >
                            刪除
                          </button>
                        )}
                      </div>

                      <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                        {n.content}
                      </div>
                    </div>
                  ))}

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