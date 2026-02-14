import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const bookId = Number(searchParams.get("bookId"));
  const chapterNumber = Number(searchParams.get("chapterNumber"));

  // 參數不對就直接 400（這樣你一看就知道缺什麼）
  if (!Number.isFinite(bookId) || !Number.isFinite(chapterNumber)) {
    return NextResponse.json(
      { ok: false, error: "Missing or invalid bookId/chapterNumber" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("verses")
    .select("id, book_id, chapter_number, verse_number, text_zh, text_en, created_at")
    .eq("book_id", bookId)
    .eq("chapter_number", chapterNumber)
    .order("verse_number", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: data ?? [] });
}