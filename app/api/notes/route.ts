import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const bookId = Number(searchParams.get("bookId"));
  const chapterNumber = Number(searchParams.get("chapterNumber"));
  const userId = String(searchParams.get("userId") ?? "").trim();

  if (!Number.isFinite(bookId) || !Number.isFinite(chapterNumber)) {
    return NextResponse.json({ ok: false, error: "bad params" }, { status: 400 });
  }

  const notesRes = await supabaseAdmin
    .from("notes")
    .select("id, book_id, chapter_number, verse_number, content, created_at")
    .eq("book_id", bookId)
    .eq("chapter_number", chapterNumber);

  if (notesRes.error) {
    return NextResponse.json({ ok: false, error: notesRes.error.message }, { status: 500 });
  }

  const notes = notesRes.data ?? [];
  const noteIds = notes.map((n) => n.id);

  if (noteIds.length === 0) {
    return NextResponse.json({ ok: true, data: [] });
  }

  // stars_count
  const starsRes = await supabaseAdmin
    .from("note_stars")
    .select("note_id")
    .in("note_id", noteIds);

  if (starsRes.error) {
    return NextResponse.json({ ok: false, error: starsRes.error.message }, { status: 500 });
  }

  const countMap = new Map<number, number>();
  for (const row of starsRes.data ?? []) {
    const nid = Number((row as any).note_id);
    countMap.set(nid, (countMap.get(nid) ?? 0) + 1);
  }

  // starred_by_me
  let starredSet = new Set<number>();
  if (userId) {
    const myStars = await supabaseAdmin
      .from("note_stars")
      .select("note_id")
      .in("note_id", noteIds)
      .eq("user_id", userId);

    if (myStars.error) {
      return NextResponse.json({ ok: false, error: myStars.error.message }, { status: 500 });
    }

    starredSet = new Set((myStars.data ?? []).map((r: any) => Number(r.note_id)));
  }

  const merged = notes
    .map((n: any) => ({
      ...n,
      stars_count: countMap.get(n.id) ?? 0,
      starred_by_me: starredSet.has(n.id),
    }))
    .sort((a: any, b: any) => {
      if (b.stars_count !== a.stars_count) return b.stars_count - a.stars_count;
      return String(a.created_at).localeCompare(String(b.created_at));
    });

  return NextResponse.json({ ok: true, data: merged });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  const bookId = Number(body?.bookId);
  const chapterNumber = Number(body?.chapterNumber);
  const verseNumber = Number(body?.verseNumber);
  const content = String(body?.content ?? "").trim();

  if (
    !Number.isFinite(bookId) ||
    !Number.isFinite(chapterNumber) ||
    !Number.isFinite(verseNumber) ||
    !content
  ) {
    return NextResponse.json({ ok: false, error: "bad body" }, { status: 400 });
  }

  const ins = await supabaseAdmin
    .from("notes")
    .insert({
      book_id: bookId,
      chapter_number: chapterNumber,
      verse_number: verseNumber,
      content,
    })
    .select("id, book_id, chapter_number, verse_number, content, created_at")
    .single();

  if (ins.error) {
    return NextResponse.json({ ok: false, error: ins.error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, data: ins.data });
}