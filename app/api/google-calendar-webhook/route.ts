import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  // Google Calendar Push Notification 헤더 확인
  const channelId = req.headers.get("x-goog-channel-id");
  const resourceState = req.headers.get("x-goog-resource-state");
  const resourceId = req.headers.get("x-goog-resource-id");

  console.log("Google Calendar webhook:", { channelId, resourceState, resourceId });

  // sync 메시지는 무시 (최초 구독 확인용)
  if (resourceState === "sync") {
    return NextResponse.json({ ok: true });
  }

  // 변경된 이벤트 목록 가져오기
  if (resourceState === "exists" || resourceState === "not_exists") {
    try {
      const accessToken = await getGoogleAccessToken();
      const calendarId = process.env.GOOGLE_CALENDAR_ID!;

      // 최근 변경된 이벤트 조회 (updatedMin: 1분 전)
      const updatedMin = new Date(Date.now() - 60 * 1000).toISOString();
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
          // 취소된 경우 → Supabase에서 status를 "cancelled"로 업데이트
          await supabase
            .from("calendar_events")
            .update({ status: "cancelled" })
            .eq("google_event_id", googleEventId);
        } else {
          // 날짜/시간 변경된 경우 → Supabase 업데이트
          const startDate = event.start?.date || event.start?.dateTime?.split("T")[0];
          const startTime = event.start?.dateTime;

          await supabase
            .from("calendar_events")
            .update({
              date: startDate,
              start_time: startTime,
              updated_at: new Date().toISOString(),
            })
            .eq("google_event_id", googleEventId);
        }
      }
    } catch (err) {
      console.error("Calendar sync error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}

// GET: Google Channel 구독 갱신용
export async function GET() {
  return NextResponse.json({ ok: true, message: "Google Calendar webhook endpoint" });
}

async function getGoogleAccessToken(): Promise<string> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // JWT 생성 (간단한 방식)
  const { SignJWT } = await import("jose");
  const privateKey = await import("jose").then(({ importPKCS8 }) =>
    importPKCS8(serviceAccount.private_key, "RS256")
  );
  const jwt = await new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(privateKey);

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}
