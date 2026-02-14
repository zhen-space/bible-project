import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function DELETE(req: Request) {
  try {
    // ✅ 不靠 params，直接從 URL 解析最後一段
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const idRaw = parts[parts.length - 1] ?? "";

    if (!idRaw) {
      return NextResponse.json(
        { ok: false, error: "bad id", debug: { pathname: url.pathname } },
        { status: 400 }
      );
    }

    const expected = process.env.ADMIN_DELETE_KEY ?? "";
    const adminKey = req.headers.get("x-admin-key") ?? "";
    if (!expected || adminKey !== expected) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { ok: false, error: "bad id", debug: { idRaw, pathname: url.pathname } },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("notes").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}