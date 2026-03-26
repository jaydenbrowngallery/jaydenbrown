import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

// ─── SOLAPI 문자 발송 ───
async function sendSMS(phone: string, text: string) {
  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const senderPhone = process.env.SOLAPI_SENDER_PHONE;

  if (!apiKey || !apiSecret || !senderPhone) {
    console.error("SOLAPI credentials missing");
    return { ok: false, error: "SOLAPI credentials missing" };
  }

  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  try {
    const res = await fetch("https://api.solapi.com/messages/v4/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
      },
      body: JSON.stringify({
        message: {
          to: phone.replace(/[^0-9]/g, ""),
          from: senderPhone,
          text,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("SOLAPI error:", err);
      return { ok: false, error: err };
    }

    return { ok: true };
  } catch (e: any) {
    console.error("SOLAPI exception:", e.message);
    return { ok: false, error: e.message };
  }
}

// ─── Google Calendar 이벤트 생성 ───
async function createCalendarEvent(data: {
  title: string;
  date: string;
  location?: string;
  description?: string;
}) {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceAccountJson || !calendarId) {
    console.error("Google Calendar credentials missing");
    return { ok: false, error: "Google Calendar credentials missing" };
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    // JWT 토큰 생성
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
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

    // Access Token 획득
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error("Google token error:", err);
      return { ok: false, error: err };
    }

    const { access_token } = await tokenRes.json();

    // 이벤트 생성
    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          summary: data.title,
          location: data.location || "",
          description: data.description || "",
          start: {
            date: data.date,
            timeZone: "Asia/Seoul",
          },
          end: {
            date: data.date,
            timeZone: "Asia/Seoul",
          },
        }),
      }
    );

    if (!eventRes.ok) {
      const err = await eventRes.text();
      console.error("Google Calendar error:", err);
      return { ok: false, error: err };
    }

    return { ok: true };
  } catch (e: any) {
    console.error("Google Calendar exception:", e.message);
    return { ok: false, error: e.message };
  }
}

// ─── 메인 API ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, phone, name, date, time, location, depositor_name, title } = body;

    const results = { sms: false, calendar: false, status: false };

    // 1. 문자 발송 (즉시)
    if (phone && phone !== "-") {
      const timeText = time === "1부" ? "1부(12시)" : time === "2부" ? "2부(14시30분)" : time === "3부" ? "3부(18시)" : time || "";
      const smsText = `[제이든브라운 스튜디오]\n\n예약이 접수되었습니다.\n\n▸ 이름: ${name || "-"}\n▸ 날짜: ${date || "-"}\n▸ 시간: ${timeText}\n▸ 장소: ${location || "도동산방"}\n\n감사합니다 😊`;

      const smsResult = await sendSMS(phone, smsText);
      results.sms = smsResult.ok;
    }

    // 2. 구글 캘린더 등록 (즉시)
    if (date) {
      const timeText = time === "1부" ? "1200" : time === "2부" ? "1430" : time === "3부" ? "1800" : time || "";
      const eventTitle = `${timeText} ${name || ""} ${location || "도동산방"}`.trim();
      const eventDescription = `이름: ${name || "-"} / 연락처: ${phone || "-"} / 입금자: ${depositor_name || "-"}`;

      const calResult = await createCalendarEvent({
        title: eventTitle,
        date,
        location: location || "도동산방",
        description: eventDescription,
      });
      results.calendar = calResult.ok;
    }

    // 3. 예약 상태 confirmed로 변경 (즉시)
    if (bookingId) {
      const { error } = await supabaseAdmin
        .from("booking_requests")
        .update({ status: "confirmed" })
        .eq("id", bookingId);

      results.status = !error;
      if (error) console.error("Status update failed:", error.message);
    }

    return NextResponse.json({ ok: true, results });
  } catch (error: any) {
    console.error("confirm-booking error:", error.message);
    return NextResponse.json(
      { ok: false, message: "처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}