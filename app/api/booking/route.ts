// app/api/booking/route.ts
// 예약 접수 (Supabase 저장)
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      date,
      time,
      product,
      location,
      address,
      address_detail,
      zipcode,
      message,
      depositor_name,
      deposit_amount,
    } = body;

    if (!name || !phone || !date) {
      return NextResponse.json(
        { error: "이름, 연락처, 날짜는 필수입니다" },
        { status: 400 }
      );
    }

    // booking_requests 테이블에 저장
    const { data, error } = await supabase
      .from("booking_requests")
      .insert({
        name,
        phone,
        email: email || null,
        date,
        time: time || null,
        product: product || null,
        location: location || null,
        address: address || null,
        address_detail: address_detail || null,
        zipcode: zipcode || null,
        message: message || null,
        depositor_name: depositor_name || null,
        deposit_amount: deposit_amount || null,
        status: "pending",
        title: `${product || "촬영"} - ${name}`,
      })
      .select()
      .single();

    if (error) {
      console.error("Booking insert error:", error);
      return NextResponse.json(
        { error: "예약 저장 실패" },
        { status: 500 }
      );
    }

    // 관리자 알림 (선택적)
    if (process.env.SOLAPI_API_KEY && process.env.ADMIN_PHONE) {
      try {
        await fetch("https://api.solapi.com/messages/v4/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SOLAPI_API_KEY}`,
          },
          body: JSON.stringify({
            message: {
              to: process.env.ADMIN_PHONE,
              from: process.env.SOLAPI_SENDER_PHONE || "",
              text: `[도동산방] 새 예약 접수\n${name} / ${phone}\n${date} ${time || ""}\n${product || "촬영"}`,
              type: "LMS",
            },
          }),
        });
      } catch (smsErr) {
        console.error("Admin notification failed:", smsErr);
      }
    }

    return NextResponse.json({ ok: true, bookingId: data.id });
  } catch (err: any) {
    console.error("Booking error:", err);
    return NextResponse.json(
      { error: err.message || "예약 접수 실패" },
      { status: 500 }
    );
  }
}
