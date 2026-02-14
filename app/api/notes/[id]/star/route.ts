import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabaseAdmin";

export async function POST(
  req: Request,
  ctx: { params: any } // Next 16/Turbopack 有時 params 不是你以為的型別
) {
  // ✅ 兼容：params 可能是 Promise 或物件
  const params = await Promise.resolve(ctx?.params);
  const idRaw = String(params?.id ?? "").trim();

  if (!idRaw) {
    return NextResponse.json(
      { ok: false, error: "bad id", debug: { params } },
      { status: 400 }
    );
  }

  const noteId = Number(idRaw);
  if (!Number.isFinite(noteId) || noteId <= 0) {
    return NextResponse.json(
      { ok: false, error: "bad id", debug: { idRaw } },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId ?? "").trim();

  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "missing userId" },
      { status: 400 }
    );
  }

  // ✅ 先確認 notes 真的存在（如果這裡查不到，就代表你在不同 DB/不同 schema）
  const exists = await supabaseAdmin
    .from("notes")
    .select("id")
    .eq("id", noteId)
    .maybeSingle();

  if (exists.error) {
    return NextResponse.json(
      { ok: false, error: exists.error.message },
      { status: 500 }
    );
  }
  if (!exists.data) {
    return NextResponse.json(
      { ok: false, error: "note not found", debug: { noteId } },
      { status: 404 }
    );
  }

  // ✅ toggle：有星就刪，沒星就加
  const already = await supabaseAdmin
    .from("note_stars")
    .select("note_id")
    .eq("note_id", noteId)
    .eq("user_id", userId)
    .maybeSingle();

  if (already.error) {
    return NextResponse.json(
      { ok: false, error: already.error.message },
      { status: 500 }
    );
  }

  let starred = false;

  if (already.data) {
    const del = await supabaseAdmin
      .from("note_stars")
      .delete()
      .eq("note_id", noteId)
      .eq("user_id", userId);

    if (del.error) {
      return NextResponse.json(
        { ok: false, error: del.error.message },
        { status: 500 }
      );
    }
    starred = false;
  } else {
    const ins = await supabaseAdmin
      .from("note_stars")
      .insert({ note_id: noteId, user_id: userId });

    if (ins.error) {
      return NextResponse.json(
        { ok: false, error: ins.error.message, debug: { noteId, userId } },
        { status: 500 }
      );
    }
    starred = true;
  }

  // 回 stars_count
  const cnt = await supabaseAdmin
    .from("note_stars")
    .select("note_id")
    .eq("note_id", noteId);

  if (cnt.error) {
    return NextResponse.json(
      { ok: false, error: cnt.error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    noteId,
    starred,
    stars_count: (cnt.data ?? []).length,
  });
}