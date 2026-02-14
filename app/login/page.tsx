<div style={{fontSize: 24}}>【NEW PAGE TEST】</div>

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Book = {
  id: number;
  order_index: number;
  name_zh: string;
  name_en: string;
};

type Chapter = {
  id: number;
  book_id: number;
  chapter_number: number;
};

export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    const fetchBooks = async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, order_index, name_zh, name_en")
        .order("order_index", { ascending: true });

      if (error) setErrorMsg(error.message);
      else {
        setBooks(data ?? []);
        setSelectedBookId((data?.[0]?.id) ?? null); // 預設選第一本
      }
    };

    fetchBooks();
  }, []);

  useEffect(() => {
    if (!selectedBookId) return;

    const fetchChapters = async () => {
      const { data, error } = await supabase
        .from("chapters")
        .select("id, book_id, chapter_number")
        .eq("book_id", selectedBookId)
        .order("chapter_number", { ascending: true });

      if (error) setErrorMsg(error.message);
      else setChapters(data ?? []);
    };

    fetchChapters();
  }, [selectedBookId]);

  return (
    <div style={{ padding: 16 }}>
      <h1>聖經書卷</h1>

      {errorMsg && (
        <div style={{ marginBottom: 12 }}>
          ❌ {errorMsg}
        </div>
      )}

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ minWidth: 240 }}>
          import Link from "next/link";

{/* 章節顯示區 */}
<div style={{ marginLeft: 20, marginTop: 8 }}>
  {bookChapters.length === 0 ? (
    <div style={{ color: "#666" }}>(這卷目前沒有章資料)</div>
  ) : (
    bookChapters.map((chapter) => (
      <Link
        key={chapter.id}
        href={`/books/${book.id}/chapters/${chapter.chapter_number}`}
        style={{
          display: "inline-block",
          padding: "6px 12px",
          border: "1px solid #ccc",
          borderRadius: 10,
          marginRight: 10,
          textDecoration: "none",
          color: "#111",
          background: "#f5f5f5",
        }}
      >
        第 {chapter.chapter_number} 章
      </Link>
    ))
  )}
</div>