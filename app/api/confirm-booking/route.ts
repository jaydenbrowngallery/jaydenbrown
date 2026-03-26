import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { bookingId, ...webhookData } = body;

  // 1. Make 웹훅 호출 (문자 발송 + 구글 캘린더)
  const webhookUrl = process.env.MAKE_CONFIRM_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json({ error: "Webhook URL not configured" }, { status: 500 });
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookData),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }

  // 2. 예약 상태를 confirmed로 변경
  if (bookingId) {
    const { error } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "confirmed" })
      .eq("id", bookingId);

    if (error) {
      console.error("Status update failed:", error.message);
    }
  }

  return NextResponse.json({ ok: true });
}
