// app/api/confirm-booking/route.ts
// 기존 로직 유지 + 상태를 deposit_pending으로 변경 + 캘린더 색상 구분

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import crypto from "crypto";

// Google Calendar 이벤트 색상 ID
const CALENDAR_COLORS = {
  deposit_pending: "6", // Tangerine (주황) — 입금대기
  confirmed: "10",      // Basil (초록) — 예약확정
};

// ─── SOLAPI 문자 발송 (LMS 장문) ───
async function sendLMS(phone: string, text: string) {
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
          type: "LMS",
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

// ─── Google Calendar 이벤트 생성 (색상 지원) ───
async function createCalendarEvent(data: {
  title: string;
  date: string;
  location?: string;
  description?: string;
  colorId?: string;
}): Promise<{ ok: boolean; error?: string; eventId?: string }> {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!serviceAccountJson || !calendarId) {
    console.error("Google Calendar credentials missing");
    return { ok: false, error: "Google Calendar credentials missing" };
  }

  try {
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
      console.error("Google token error:", err);
      return { ok: false, error: err };
    }
    const { access_token } = await tokenRes.json();

    const eventBody: any = {
      summary: data.title,
      location: data.location || "",
      description: data.description || "",
      start: { date: data.date, timeZone: "Asia/Seoul" },
      end: { date: data.date, timeZone: "Asia/Seoul" },
    };
    if (data.colorId) {
      eventBody.colorId = data.colorId;
    }

    const eventRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!eventRes.ok) {
      const err = await eventRes.text();
      console.error("Google Calendar error:", err);
      return { ok: false, error: err };
    }

    const eventData = await eventRes.json();
    return { ok: true, eventId: eventData.id };
  } catch (e: any) {
    console.error("Google Calendar exception:", e.message);
    return { ok: false, error: e.message };
  }
}

// ─── 문자 내용 생성 ───
function buildSMSText(data: {
  name?: string;
  date?: string;
  time?: string;
  location?: string;
  phone?: string;
  depositor_name?: string;
}) {
  const timeText =
    data.time === "1부"
      ? "1부(12시)"
      : data.time === "2부"
        ? "2부(14시30분)"
        : data.time === "3부"
          ? "3부(18시)"
          : data.time || "-";

  return `안녕하세요, ${data.name || "-"}님 촬영 예약 신청이 접수되었습니다.

━━━━ 예약 내용 ━━━━
촬영 종류 : ${timeText}
행사 날짜 : ${data.date || "-"}
장       소 : ${data.location || "도동산방"}
연  락  처 : ${data.phone || "-"}
촬  영  자 : ${data.name || "-"}
입  금  자  명 : ${data.depositor_name || "-"}
━━━━━━━━━━━━━━━━━

안녕하세요.
예약 진행에 앞서 예약금 및 환불 규정을 안내드립니다.

예약금은 입금일 기준 3주 이내 취소 시 전액 환불이 가능하며, 이후에는 환불이 불가합니다.
또한, 촬영일 기준 3주 이내에 예약금을 입금하신 경우에는 환불이 불가한 점 안내드립니다.

행사 촬영(돌잔치 등)의 특성상, 예약이 확정되면 해당 날짜에 대한 다른 문의 및 예약을 모두 제한하게 되며, 그로 인해 해당 일정은 제3자에게 제공되지 못하고 사실상 재예약이 어려운 상태가 됩니다.
이에 따라 일정 확보에 따른 손해가 발생할 수 있어, 위와 같은 환불 규정을 적용하고 있습니다.

위 내용을 충분히 확인하시고 동의하시는 경우에 한하여 예약금 입금을 부탁드리며, 예약금 입금 시 본 환불 규정에 동의하신 것으로 간주됩니다.

━━━━ 입금 계좌 ━━━━
신 한 은 행
1 1 0 - 3 4 3 - 7 6 5 5 0 7
예 금 주 : 박 이 용
━━━━━━━━━━━━━━━━━

입금이 확인되면 확정 문자를 드립니다.
제이든 브라운과 함께해 주셔서 감사합니다.`;
}

// ─── 메인 API ───
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, phone, name, date, time, location, depositor_name } =
      body;

    const results = { sms: false, calendar: false, status: false };

    // 1. LMS 문자 발송 (즉시)
    if (phone && phone !== "-") {
      const smsText = buildSMSText({
        name,
        date,
        time,
        location,
        phone,
        depositor_name,
      });
      const smsResult = await sendLMS(phone, smsText);
      results.sms = smsResult.ok;
    }

    // 2. 구글 캘린더 등록 (입금대기 색상: 주황)
    let googleEventId: string | undefined;
    if (date) {
      const timeCode =
        time === "1부"
          ? "1200"
          : time === "2부"
            ? "1430"
            : time === "3부"
              ? "1800"
              : time || "";
      const eventTitle =
        `[입금대기] ${timeCode} ${name || ""} ${location || "도동산방"}`.trim();
      const eventDescription = `이름: ${name || "-"} / 연락처: ${phone || "-"} / 입금자: ${depositor_name || "-"} / 상태: 입금대기`;

      const calResult = await createCalendarEvent({
        title: eventTitle,
        date,
        location: location || "도동산방",
        description: eventDescription,
        colorId: CALENDAR_COLORS.deposit_pending,
      });
      results.calendar = calResult.ok;

      if (calResult.eventId) {
        googleEventId = calResult.eventId;
      }
    }

    // 3. 예약 상태를 deposit_pending으로 변경 + google_event_id 저장
    if (bookingId) {
      const updateData: Record<string, any> = { status: "deposit_pending" };

      if (googleEventId) {
        updateData.google_event_id = googleEventId;
      }

      const { error } = await supabaseAdmin
        .from("booking_requests")
        .update(updateData)
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