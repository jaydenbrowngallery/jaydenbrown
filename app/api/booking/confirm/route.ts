import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;

    if (!id) {
      return NextResponse.json(
        { ok: false, message: "id가 없습니다." },
        { status: 400 }
      );
    }

    const { supabase } = await requireAdmin();

    const { error } = await supabase
      .from("booking_requests")
      .update({ status: "confirmed" })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { ok: false, message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: "상태 변경 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}