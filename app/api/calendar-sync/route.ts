// app/api/calendar-sync/route.ts
// Google Calendar → Supabase 전체 동기화 (description 포함)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Google Access Token 발급 ───
async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/calendar.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })).toString("base64url");

  const signInput = `${header}.${payload}`;
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signInput);
  const signature = sign.sign(serviceAccount.private_key, "base64url");
  const jwt = `${signInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) throw new Error(`Token error: ${await tokenRes.text()}`);
  const { access_token } = await tokenRes.json();
  return access_token;
}

// ─── Google Calendar 이벤트 목록 조회 (description 포함) ───
async function fetchCalendarEvents(accessToken: string, timeMin: string, timeMax: string) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID missing");

  const allEvents: any[] = [];
  let pageToken: string | null = null;

  do {
    const params = new URLSearchParams({
      timeMin,
      timeMax,
      maxResults: "250",
      singleEvents: "true",
      orderBy: "startTime",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!res.ok) throw new Error(`Calendar API error: ${await res.text()}`);
    const data = await res.json();
    allEvents.push(...(data.items || []));
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return allEvents;
}

export async function POST(req: NextRequest) {
  try {
    // 과거 1년 ~ 미래 6개월
    const timeMin = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const accessToken = await getGoogleAccessToken();
    const events = await fetchCalendarEvents(accessToken, timeMin, timeMax);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const event of events) {
      if (!event.id) {
        skipped++;
        continue;
      }

      if (event.status === "cancelled") {
        await supabase.from("calendar_events").delete().eq("external_id", event.id);
        await supabase.from("booking_requests").delete().eq("google_event_id", event.id);
        skipped++;
        continue;
      }

      const startDateTime = event.start?.dateTime || null;
      const startDate = event.start?.date || (startDateTime ? startDateTime.split("T")[0] : null);
      const endDateTime = event.end?.dateTime || null;
      const endDate = event.end?.date || (endDateTime ? endDateTime.split("T")[0] : null);

      const startAt = startDateTime || (startDate ? `${startDate}T00:00:00+09:00` : null);
      const endAt = endDateTime || (endDate ? `${endDate}T23:59:59+09:00` : null);

      const summary = event.summary || "(제목 없음)";
      const description = event.description || null;
      const location = event.location || null;

      // calendar_events에 upsert (external_id 기준)
      const { data: existing } = await supabase
        .from("calendar_events")
        .select("id")
        .eq("external_id", event.id)
        .maybeSingle();

      if (existing) {
        // 기존 레코드 업데이트 (description 포함!)
        await supabase
          .from("calendar_events")
          .update({
            title: summary,
            description,
            location,
            start_at: startAt,
            end_at: endAt,
          })
          .eq("id", existing.id);
        updated++;
      } else {
        // 새 레코드 생성
        await supabase
          .from("calendar_events")
          .insert({
            external_id: event.id,
            title: summary,
            description,
            location,
            start_at: startAt,
            end_at: endAt,
            source: "google",
          });
        created++;
      }

      // booking_requests에도 날짜 동기화 (있는 경우)
      const { data: bookingExisting } = await supabase
        .from("booking_requests")
        .select("id")
        .eq("google_event_id", event.id)
        .maybeSingle();

      if (bookingExisting) {
        await supabase
          .from("booking_requests")
          .update({
            date: startDate,
            time: startDateTime
              ? new Date(startDateTime).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Seoul",
                })
              : undefined,
          })
          .eq("id", bookingExisting.id);
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

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Calendar sync endpoint. Use POST to trigger sync.",
  });
}