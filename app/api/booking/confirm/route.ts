import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "id가 없습니다." }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("booking_requests")
      .update({ status: "confirmed" })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: "status 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}