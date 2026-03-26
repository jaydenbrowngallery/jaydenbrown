import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createCalendarEvent } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Google Calendar 이벤트 색상 ID
// 1: Lavender, 2: Sage, 3: Grape, 4: Flamingo, 5: Banana
// 6: Tangerine, 7: Peacock, 8: Graphite, 9: Blueberry, 10: Basil, 11: Tomato
const CALENDAR_COLORS = {
  deposit_pending: "6", // Tangerine (주황) — 입금대기
  confirmed: "10",      // Basil (초록) — 예약확정
};

// ── SOLAPI HMAC-SHA256 인증 헤더 생성 ──
function getSolapiAuthHeader() {
  const apiKey = process.env.SOLAPI_API_KEY!;
  const apiSecret = process.env.SOLAPI_API_SECRET!;
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString("hex");
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(date + salt)
    .digest("hex");

  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

// ── 문자 발송 (SOLAPI) ──
async function sendSMS(to: string, text: string) {
  const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSolapiAuthHeader(),
    },
    body: JSON.stringify({
      messages: [
        {
          to,
          from: process.env.SOLAPI_SENDER_PHONE!,
          text,
          type: "LMS",
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("SOLAPI 발송 실패:", err);
    throw new Error(`SOLAPI error: ${err}`);
  }
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bookingId,
      phone,
      name,
      date,
      time,
      location,
      depositor_name,
      deposit_amount,
    } = body;

    if (!bookingId || !phone || !name || !date || !time) {
      return NextResponse.json(
        { error: "필수 필드가 누락되었습니다." },
        { status: 400 }
      );
    }

    // ── 1. 입금대기 문자 발송 ──
    const depositMsg = [
      `[제이든브라운 스튜디오] 예약 안내`,
      ``,
      `${name}님, 예약 접수가 완료되었습니다.`,
      ``,
      `▸ 일시: ${date} ${time}`,
      `▸ 장소: ${location || "스튜디오"}`,
      deposit_amount ? `▸ 예약금: ${Number(deposit_amount).toLocaleString()}원` : "",
      depositor_name ? `▸ 입금자명: ${depositor_name}` : "",
      ``,
      `아래 계좌로 예약금을 입금해주시면`,
      `확정 안내 문자를 보내드립니다.`,
      ``,
      `▸ 입금계좌: [계좌정보]`,
      ``,
      `감사합니다.`,
    ]
      .filter(Boolean)
      .join("\n");

    await sendSMS(phone, depositMsg);

    // ── 2. Google Calendar 이벤트 생성 (입금대기 색상) ──
    const startDate = new Date(`${date}T${time}:00+09:00`);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1h

    const eventTitle = `[입금대기] ${name}`;
    const eventDescription = [
      `이름: ${name}`,
      `전화: ${phone}`,
      depositor_name ? `입금자명: ${depositor_name}` : "",
      deposit_amount ? `예약금: ${Number(deposit_amount).toLocaleString()}원` : "",
      `장소: ${location || "스튜디오"}`,
      `상태: 입금대기`,
    ]
      .filter(Boolean)
      .join("\n");

    let googleEventId: string | null = null;
    try {
      const event = await createCalendarEvent({
        summary: eventTitle,
        description: eventDescription,
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        location: location || "스튜디오",
        colorId: CALENDAR_COLORS.deposit_pending,
      });
      googleEventId = event.id;
    } catch (calErr) {
      console.error("캘린더 이벤트 생성 실패:", calErr);
      // 캘린더 실패해도 예약 처리는 계속
    }

    // ── 3. Supabase 상태 업데이트: deposit_pending ──
    const updateData: Record<string, any> = {
      status: "deposit_pending",
    };
    if (googleEventId) {
      updateData.google_event_id = googleEventId;
    }

    const { error: dbError } = await supabaseAdmin
      .from("booking_requests")
      .update(updateData)
      .eq("id", bookingId);

    if (dbError) {
      console.error("Supabase 업데이트 실패:", dbError);
      return NextResponse.json(
        { error: "DB 업데이트 실패", detail: dbError.message },
        { status: 500 }
      );
    }

    // ── 4. Make 웹훅 호출 (선택) ──
    if (process.env.MAKE_CONFIRM_WEBHOOK_URL) {
      try {
        await fetch(process.env.MAKE_CONFIRM_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId,
            name,
            phone,
            date,
            time,
            location,
            depositor_name,
            status: "deposit_pending",
          }),
        });
      } catch (webhookErr) {
        console.error("Make 웹훅 호출 실패:", webhookErr);
      }
    }

    return NextResponse.json({
      success: true,
      status: "deposit_pending",
      googleEventId,
      message: "입금대기 문자 발송 및 캘린더 등록 완료",
    });
  } catch (err: any) {
    console.error("confirm-booking 에러:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
