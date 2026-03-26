// app/api/calendar-sync/route.ts
// Google Calendar → Supabase 전체 동기화
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { listCalendarEvents } from "@/lib/google-calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    // 향후 6개월 이벤트 조회
    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const events = await listCalendarEvents({
      timeMin,
      timeMax,
      maxResults: 250,
    });

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.id || event.status === "cancelled") continue;

      const startDate =
        event.start?.date || event.start?.dateTime?.split("T")[0];
      const startTime = event.start?.dateTime || null;
      const summary = event.summary || "(제목 없음)";

      // google_event_id로 기존 booking 조회
      const { data: existing } = await supabase
        .from("booking_requests")
        .select("id, google_event_id")
        .eq("google_event_id", event.id)
        .maybeSingle();

      if (existing) {
        // 기존 레코드 업데이트 (날짜/시간 동기화)
        await supabase
          .from("booking_requests")
          .update({
            date: startDate,
            time: startTime
              ? new Date(startTime).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Seoul",
                })
              : undefined,
          })
          .eq("id", existing.id);
        updated++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      ok: true,
      total: events.length,
      created,
      updated,
      skipped,
    });
  } catch (err: any) {
    console.error("Calendar sync error:", err);
    return NextResponse.json(
      { error: err.message || "동기화 실패" },
      { status: 500 }
    );
  }
}

// GET: 상태 확인용
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Calendar sync endpoint. Use POST to trigger sync.",
  });
}
