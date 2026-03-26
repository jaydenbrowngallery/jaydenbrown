import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase/admin";

const CALENDAR_COLORS = {
  confirmed: "10", // Basil (초록)
};

// ── SOLAPI ──
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

// ── 신한은행 입금 문자 파싱 ──
interface ParsedDeposit {
  bank: string;
  date: string;      // "03/25 11:37"
  account: string;
  type: "입금" | "출금";
  amount: number;
  balance: number;
  depositor: string;
}

function parseBankSMS(text: string): ParsedDeposit | null {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 최소 5줄 필요: [Web발신], 은행+날짜, 계좌, 입금/출금, 잔액, 입금자
  if (lines.length < 5) return null;

  // [Web발신] 제거
  const startIdx = lines[0].includes("Web발신") ? 1 : 0;
  const content = lines.slice(startIdx);

  if (content.length < 5) return null;

  // Line 0: "신한03/25 11:37"
  const bankDateMatch = content[0].match(/^(신한|국민|우리|하나|농협|기업|SC)(.+)$/);
  if (!bankDateMatch) return null;

  const bank = bankDateMatch[1];
  const date = bankDateMatch[2].trim();

  // Line 1: 계좌번호
  const account = content[1];

  // Line 2: "입금    50,000" 또는 "출금    25,900"
  const txMatch = content[2].match(/^(입금|출금)\s+([\d,]+)/);
  if (!txMatch) return null;

  const type = txMatch[1] as "입금" | "출금";
  const amount = parseInt(txMatch[2].replace(/,/g, ""), 10);

  // Line 3: "잔액 2,579,154"
  const balMatch = content[3].match(/잔액\s+([\d,]+)/);
  const balance = balMatch ? parseInt(balMatch[1].replace(/,/g, ""), 10) : 0;

  // Line 4: 입금자명 (마지막 줄)
  const depositor = content[4].trim();

  return { bank, date, account, type, amount, balance, depositor };
}

// ── 이름 매칭 ──
function normalizeKoreanName(name: string): string {
  return name
    .replace(/\s+/g, "")
    .replace(/[^가-힣a-zA-Z0-9]/g, "")
    .toLowerCase();
}

function namesMatch(bankName: string, bookingName: string): boolean {
  const normalizedBooking = normalizeKoreanName(bookingName);
  if (!normalizedBooking) return false;

  const bankClean = bankName.replace(/\(.*?\)?$/, "").trim();
  const parenMatch = bankName.match(/\(([^)]*)\)?/);
  const parenName = parenMatch ? parenMatch[1] : "";
  const slashNames = bankClean.split("/").map((s) => s.trim());

  const candidates = [bankClean, parenName, ...slashNames]
    .map(normalizeKoreanName)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === normalizedBooking) return true;
    if (candidate.includes(normalizedBooking)) return true;
    if (normalizedBooking.includes(candidate) && candidate.length >= 2)
      return true;
  }

  return false;
}

// ── API: 웹훅 수신 (Make에서 호출) ──
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Make에서 보내는 데이터: { smsText: "문자 전체 내용" }
    // 또는 이미 파싱된 데이터: { depositor: "홍길동", amount: 50000 }
    let depositor: string;
    let amount: number;

    if (body.smsText) {
      // 문자 원문 파싱
      const parsed = parseBankSMS(body.smsText);

      if (!parsed) {
        return NextResponse.json({
          success: false,
          error: "문자 형식을 인식할 수 없습니다.",
          raw: body.smsText,
        });
      }

      // 출금은 무시
      if (parsed.type === "출금") {
        return NextResponse.json({
          success: true,
          skipped: true,
          reason: "출금 건 — 처리 불요",
        });
      }

      depositor = parsed.depositor;
      amount = parsed.amount;
    } else if (body.depositor && body.amount) {
      // 이미 파싱된 데이터
      depositor = body.depositor;
      amount = parseInt(String(body.amount).replace(/,/g, ""), 10);
    } else {
      return NextResponse.json(
        { error: "smsText 또는 depositor+amount가 필요합니다." },
        { status: 400 }
      );
    }

    // ── deposit_pending 예약 조회 ──
    const { data: pendingBookings, error: dbError } = await supabaseAdmin
      .from("booking_requests")
      .select("*")
      .eq("status", "deposit_pending");

    if (dbError) {
      return NextResponse.json(
        { error: "DB 조회 실패", detail: dbError.message },
        { status: 500 }
      );
    }

    if (!pendingBookings || pendingBookings.length === 0) {
      return NextResponse.json({
        success: true,
        matched: false,
        depositor,
        amount,
        reason: "입금대기 예약 없음",
      });
    }

    // ── 매칭 ──
    let matchedBooking: any = null;

    for (const booking of pendingBookings) {
      const bookingDepositor = booking.depositor_name || booking.name;
      if (namesMatch(depositor, bookingDepositor)) {
        matchedBooking = booking;
        break;
      }
    }

    if (!matchedBooking) {
      return NextResponse.json({
        success: true,
        matched: false,
        depositor,
        amount,
        reason: "매칭되는 예약 없음",
        pendingCount: pendingBookings.length,
      });
    }

    // ── 확정 처리 ──
    // 1. DB 상태 변경
    const { error: updateErr } = await supabaseAdmin
      .from("booking_requests")
      .update({ status: "confirmed" })
      .eq("id", matchedBooking.id);

    if (updateErr) {
      return NextResponse.json(
        { error: "상태 업데이트 실패", detail: updateErr.message },
        { status: 500 }
      );
    }

    // 2. 캘린더 업데이트
    if (matchedBooking.google_event_id) {
      try {
        await updateCalendarEvent(matchedBooking.google_event_id, {
          summary: `[확정] ${matchedBooking.name}`,
          colorId: CALENDAR_COLORS.confirmed,
          description: [
            `이름: ${matchedBooking.name}`,
            `전화: ${matchedBooking.phone}`,
            matchedBooking.depositor_name
              ? `입금자명: ${matchedBooking.depositor_name}`
              : "",
            `장소: ${matchedBooking.location || "스튜디오"}`,
            `상태: 예약확정 ✅`,
            `입금액: ${amount.toLocaleString()}원`,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (calErr) {
        console.error("캘린더 업데이트 실패:", calErr);
      }
    }

    // 3. 확정 문자 발송
    const confirmMsg = [
      `[제이든브라운 스튜디오] 예약 확정 안내`,
      ``,
      `${matchedBooking.name}님, 입금이 확인되어`,
      `예약이 확정되었습니다.`,
      ``,
      `▸ 일시: ${matchedBooking.date} ${matchedBooking.time}`,
      `▸ 장소: ${matchedBooking.location || "스튜디오"}`,
      ``,
      `감사합니다.`,
    ].join("\n");

    let smsSent = false;
    try {
      await sendSMS(matchedBooking.phone, confirmMsg);
      smsSent = true;
    } catch (smsErr) {
      console.error("확정 문자 발송 실패:", smsErr);
    }

    return NextResponse.json({
      success: true,
      matched: true,
      depositor,
      amount,
      booking: {
        id: matchedBooking.id,
        name: matchedBooking.name,
        depositorName: matchedBooking.depositor_name,
        date: matchedBooking.date,
        time: matchedBooking.time,
      },
      confirmed: true,
      smsSent,
    });
  } catch (err: any) {
    console.error("deposit-sms 에러:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}