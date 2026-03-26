// app/api/confirm-booking/route.ts
// 예약 확정 시 Google Calendar 이벤트 자동 생성 + Supabase 업데이트
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createCalendarEvent } from "@/lib/google-calendar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId 필수" }, { status: 400 });
    }

    // 예약 정보 조회
    const { data: booking, error: fetchError } = await supabase
      .from("booking_requests")
      .select("*")
      .eq("id", bookingId)
      .single();

    if (fetchError || !booking) {
      return NextResponse.json({ error: "예약을 찾을 수 없습니다" }, { status: 404 });
    }

    // 이미 확정된 예약이면 중복 방지
    if (booking.google_event_id) {
      return NextResponse.json({
        ok: true,
        message: "이미 캘린더에 등록된 예약입니다",
        eventId: booking.google_event_id,
      });
    }

    // 시작/종료 시간 생성
    const dateStr = booking.date; // "2026-04-15"
    const timeStr = booking.time || "10:00"; // "14:00"

    const startDateTime = `${dateStr}T${timeStr}:00+09:00`;
    // 기본 2시간 촬영
    const startDate = new Date(startDateTime);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    const endDateTime = endDate.toISOString().replace("Z", "+09:00");

    // 캘린더 이벤트 제목 생성
    const summary = `📸 ${booking.product || "촬영"} - ${booking.name}`;
    const description = [
      `고객명: ${booking.name}`,
      `연락처: ${booking.phone}`,
      booking.email ? `이메일: ${booking.email}` : null,
      booking.message ? `메모: ${booking.message}` : null,
      `예약ID: ${bookingId}`,
    ]
      .filter(Boolean)
      .join("\n");

    // Google Calendar 이벤트 생성
    const event = await createCalendarEvent({
      summary,
      description,
      startDateTime,
      endDateTime: endDateTime.includes("+09:00")
        ? endDateTime
        : `${dateStr}T${String(parseInt(timeStr) + 2).padStart(2, "0")}:${timeStr.split(":")[1] || "00"}:00+09:00`,
      location: booking.location || booking.address || "도동산방",
    });

    // Supabase 업데이트: status + google_event_id
    await supabase
      .from("booking_requests")
      .update({
        status: "confirmed",
        google_event_id: event.id,
      })
      .eq("id", bookingId);

    // LMS 문자 발송 (솔라피) — 기존 로직 유지
    if (process.env.SOLAPI_API_KEY && booking.phone) {
      try {
        const smsBody: Record<string, any> = {
          message: {
            to: booking.phone,
            from: process.env.SOLAPI_SENDER_PHONE || "",
            text: `[도동산방] ${booking.name}님, 예약이 확정되었습니다.\n\n📅 ${booking.date} ${booking.time || ""}\n📸 ${booking.product || "촬영"}\n📍 ${booking.location || booking.address || "도동산방"}\n\n감사합니다.`,
            type: "LMS",
          },
        };

        await fetch("https://api.solapi.com/messages/v4/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SOLAPI_API_KEY}`,
          },
          body: JSON.stringify(smsBody),
        });
      } catch (smsErr) {
        console.error("SMS 발송 실패 (예약은 확정됨):", smsErr);
      }
    }

    return NextResponse.json({
      ok: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
      bookingId,
    });
  } catch (err: any) {
    console.error("Confirm booking error:", err);
    return NextResponse.json(
      { error: err.message || "예약 확정 실패" },
      { status: 500 }
    );
  }
}
