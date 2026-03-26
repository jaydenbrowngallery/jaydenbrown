import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CALENDAR_COLORS = {
  confirmed: "10", // Basil (초록)
};

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

async function sendSMS(to: string, text: string) {
  const res = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: getSolapiAuthHeader(),
    },
    body: JSON.stringify({
      messages: [
        { to, from: process.env.SOLAPI_SENDER_PHONE!, text, type: "LMS" },
      ],
    }),
  });
  if (!res.ok) throw new Error(`SOLAPI error: ${await res.text()}`);
  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "bookingId가 필요합니다." },
        { status: 400 }
      );
    }

    // 1. 예약 조회
    const { data: booking, error: fetchErr } = await supabaseAdmin
      .from("booking_requests")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json(
        { error: "예약을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (booking.status === "confirmed") {
      return NextResponse.json(
        { error: "이미 확정된 예약입니다." },
        { status: 400 }
      );
    }

    // 2. 상태 변경
    const { error: updateErr } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (updateErr) {
      return NextResponse.json(
        { error: "상태 업데이트 실패", detail: updateErr.message },
        { status: 500 }
      );
    }

    // 3. 캘린더 업데이트
    if (booking.google_event_id) {
      try {
        await updateCalendarEvent(booking.google_event_id, {
          summary: `[확정] ${booking.name}`,
          colorId: CALENDAR_COLORS.confirmed,
          description: [
            `이름: ${booking.name}`,
            `전화: ${booking.phone}`,
            booking.depositor_name
              ? `입금자명: ${booking.depositor_name}`
              : "",
            `장소: ${booking.location || "스튜디오"}`,
            `상태: 예약확정 ✅`,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (calErr) {
        console.error("캘린더 업데이트 실패:", calErr);
      }
    }

    // 4. 확정 문자 발송
    const confirmMsg = [
      `[제이든브라운 스튜디오] 예약 확정 안내`,
      ``,
      `${booking.name}님, 입금이 확인되어`,
      `예약이 확정되었습니다.`,
      ``,
      `▸ 일시: ${booking.date} ${booking.time}`,
      `▸ 장소: ${booking.location || "스튜디오"}`,
      ``,
      `감사합니다.`,
    ].join("\n");

    try {
      await sendSMS(booking.phone, confirmMsg);
    } catch (smsErr) {
      console.error("확정 문자 발송 실패:", smsErr);
      return NextResponse.json({
        success: true,
        smsError: true,
        message: "예약 확정 완료 (문자 발송 실패)",
      });
    }

    return NextResponse.json({
      success: true,
      message: "예약 확정 + 문자 발송 완료",
    });
  } catch (err: any) {
    console.error("deposit-confirm 에러:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
