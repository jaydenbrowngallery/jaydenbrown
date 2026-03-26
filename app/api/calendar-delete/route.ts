// app/api/calendar-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteCalendarEvent } from "@/lib/google-calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, bookingId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId 필수" }, { status: 400 });
    }

    // Google Calendar에서 삭제
    await deleteCalendarEvent(eventId);

    // bookingId가 있으면 booking_requests에서 google_event_id 제거
    if (bookingId) {
      await supabase
        .from("booking_requests")
        .update({ google_event_id: null, status: "cancelled" })
        .eq("id", bookingId);
    }

    return NextResponse.json({ ok: true, deleted: eventId });
  } catch (err: any) {
    console.error("Calendar delete error:", err);
    return NextResponse.json(
      { error: err.message || "이벤트 삭제 실패" },
      { status: 500 }
    );
  }
}
