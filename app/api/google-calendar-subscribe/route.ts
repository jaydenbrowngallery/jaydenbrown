// app/api/google-calendar-subscribe/route.ts
// Google Calendar Push Notification 구독 등록/갱신
import { NextResponse } from "next/server";
import { getGoogleAccessToken } from "@/lib/google-calendar";
import { randomUUID } from "crypto";

export async function POST() {
  try {
    const accessToken = await getGoogleAccessToken();
    const calendarId = process.env.GOOGLE_CALENDAR_ID!;
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.jaydenbrown.kr"}/api/google-calendar-webhook`;

    const channelId = randomUUID();
    // 최대 7일 (Google Calendar API 제한)
    const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/watch`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: channelId,
          type: "web_hook",
          address: webhookUrl,
          expiration,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`구독 등록 실패 (${res.status}): ${err}`);
    }

    const data = await res.json();
    console.log("Calendar subscription created:", data);

    return NextResponse.json({
      ok: true,
      channelId: data.id,
      resourceId: data.resourceId,
      expiration: new Date(Number(data.expiration)).toISOString(),
    });
  } catch (err: any) {
    console.error("Calendar subscribe error:", err);
    return NextResponse.json(
      { error: err.message || "구독 등록 실패" },
      { status: 500 }
    );
  }
}

// GET: 현재 구독 상태 확인
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "POST로 구독 등록. 7일마다 갱신 필요.",
  });
}
