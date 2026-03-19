import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json(
        { ok: false, message: "선택된 항목이 없습니다." },
        { status: 400 }
      );
    }

    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("booking_requests")
      .delete()
      .in("id", ids); // 🔥 이게 정답

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: "삭제 실패" },
      { status: 500 }
    );
  }
}