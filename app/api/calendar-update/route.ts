// app/api/calendar-update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, summary, description, startDateTime, endDateTime, location } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId 필수" }, { status: 400 });
    }

    const updated = await updateCalendarEvent(eventId, {
      summary,
      description,
      startDateTime,
      endDateTime,
      location,
    });

    return NextResponse.json({
      ok: true,
      eventId: updated.id,
      updated: updated.updated,
    });
  } catch (err: any) {
    console.error("Calendar update error:", err);
    return NextResponse.json(
      { error: err.message || "이벤트 수정 실패" },
      { status: 500 }
    );
  }
}
