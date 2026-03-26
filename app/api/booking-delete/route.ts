import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId 필수" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("booking_requests")
      .delete()
      .eq("id", bookingId);

    if (error) {
      console.error("예약 삭제 실패:", error);
      return NextResponse.json(
        { error: "삭제 실패", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, deleted: bookingId });
  } catch (err: any) {
    console.error("booking-delete error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
