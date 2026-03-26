import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, ...fields } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId 필수" }, { status: 400 });
    }

    // 업데이트할 필드만 추출 (빈 문자열도 허용)
    const updateData: Record<string, any> = {};
    const allowedFields = [
      "title", "name", "phone", "email", "date", "time",
      "location", "address", "address_detail", "depositor_name",
      "product", "message", "status", "deposit_amount",
    ];

    for (const key of allowedFields) {
      if (key in fields) {
        if (key === "deposit_amount") {
          updateData[key] = fields[key] ? Number(fields[key]) : 0;
        } else {
          updateData[key] = fields[key] || null;
        }
      }
    }

    // title 자동 생성: 시간 + 이름 + 장소
    if (fields.name || fields.time || fields.location) {
      const timeCode =
        (fields.time || "") === "1부" ? "1200"
        : (fields.time || "") === "2부" ? "1430"
        : (fields.time || "") === "3부" ? "1800"
        : fields.time || "";
      const autoTitle = `${timeCode} ${fields.name || ""} ${fields.location || "도동산방"}`.trim();
      if (autoTitle) {
        updateData.title = autoTitle;
      }
    }

    const { error } = await supabaseAdmin
      .from("booking_requests")
      .update(updateData)
      .eq("id", bookingId);

    if (error) {
      console.error("예약 수정 실패:", error);
      return NextResponse.json(
        { error: "수정 실패", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, updated: bookingId });
  } catch (err: any) {
    console.error("booking-update error:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
