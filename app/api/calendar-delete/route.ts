// app/api/calendar-delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

// ─── Google Access Token 발급 (confirm-booking과 동일한 방식) ───
async function getGoogleAccessToken(): Promise<string> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing");

  const serviceAccount = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/calendar",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  ).toString("base64url");

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

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token error: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, bookingId } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId 필수" }, { status: 400 });
    }

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      return NextResponse.json({ error: "GOOGLE_CALENDAR_ID missing" }, { status: 500 });
    }

    // 1. Google Calendar에서 삭제
    try {
      const accessToken = await getGoogleAccessToken();
      const deleteRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      // 204: 성공, 404/410: 이미 삭제됨 → 모두 OK
      if (!deleteRes.ok && deleteRes.status !== 404 && deleteRes.status !== 410) {
        const err = await deleteRes.text();
        console.error("Google Calendar delete error:", deleteRes.status, err);
      }
    } catch (calErr: any) {
      console.error("Google Calendar delete exception:", calErr.message);
      // 캘린더 삭제 실패해도 DB 정리는 진행
    }

    // 2. bookingId가 있으면 google_event_id 제거 + status cancelled
    if (bookingId) {
      await supabaseAdmin
        .from("booking_requests")
        .delete()
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