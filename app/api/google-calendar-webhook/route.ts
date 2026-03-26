// app/api/google-calendar-webhook/route.ts
// Google Calendar Push Notification → Supabase 실시간 동기화
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGoogleAccessToken } from "@/lib/google-calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");
  const resourceId = req.headers.get("x-goog-resource-id");

  console.log("Google Calendar webhook:", { channelId, resourceState, resourceId });

  // sync 메시지는 무시 (최초 구독 확인용)
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  if (resourceState === "exists" || resourceState === "not_exists") {
    try {
      const accessToken = await getGoogleAccessToken("https://www.googleapis.com/auth/calendar.readonly");
      const calendarId = process.env.GOOGLE_CALENDAR_ID!;

      // 최근 변경된 이벤트 조회 (updatedMin: 2분 전, 여유 확보)
      const updatedMin = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?updatedMin=${updatedMin}&showDeleted=true&singleEvents=true`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const eventsData = await eventsRes.json();
      const events = eventsData.items || [];

      for (const event of events) {
        const googleEventId = event.id;
        const status = event.status; // "confirmed" | "cancelled"

        if (status === "cancelled") {
          // Google Calendar에서 삭제됨 → booking_requests status 업데이트
          await supabase
            .from("booking_requests")
            .delete()
            .eq("google_event_id", googleEventId);

          // calendar_events에서도 삭제
          await supabase
            .from("calendar_events")
            .delete()
            .eq("external_id", googleEventId);
        } else {
          // 날짜/시간/제목 변경됨 → booking_requests 업데이트
          const startDate =
            event.start?.date || event.start?.dateTime?.split("T")[0];
          const startTime = event.start?.dateTime
            ? new Date(event.start.dateTime).toLocaleTimeString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: "Asia/Seoul",
              })
            : undefined;

          const updatePayload: Record<string, any> = { date: startDate };
          if (startTime) updatePayload.time = startTime;
          if (event.summary) updatePayload.title = event.summary;

          await supabase
            .from("booking_requests")
            .update(updatePayload)
            .eq("google_event_id", googleEventId);
        }
      }
    } catch (err) {
      console.error("Calendar webhook sync error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// GET: Google Channel 구독 확인용
export async function GET() {
  return NextResponse.json({ ok: true, message: "Google Calendar webhook endpoint" });
}
