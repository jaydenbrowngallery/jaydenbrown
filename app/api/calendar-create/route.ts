// app/api/calendar-create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent } from "@/lib/google-calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, summary, description, startDateTime, endDateTime, location } = body;

    if (!summary || !startDateTime || !endDateTime) {
      return NextResponse.json(
        { error: "summary, startDateTime, endDateTime 필수" },
        { status: 400 }
      );
    }

    // Google Calendar에 이벤트 생성
    const event = await createCalendarEvent({
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
    });

    // bookingId가 있으면 booking_requests에 google_event_id 저장
    if (bookingId) {
      await supabase
        .from("booking_requests")
        .update({ google_event_id: event.id })
        .eq("id", bookingId);
    }

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
    });
  } catch (err: any) {
    console.error("Calendar create error:", err);
    return NextResponse.json(
      { error: err.message || "이벤트 생성 실패" },
      { status: 500 }
    );
  }
}
