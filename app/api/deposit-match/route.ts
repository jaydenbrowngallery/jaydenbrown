import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { updateCalendarEvent } from "@/lib/google-calendar";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Google Calendar 이벤트 색상 ID
const CALENDAR_COLORS = {
  deposit_pending: "6", // Tangerine (주황) — 입금대기
  confirmed: "10",      // Basil (초록) — 예약확정
};

// ── SOLAPI HMAC-SHA256 인증 헤더 ──
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
    throw new Error(`SOLAPI error: ${err}`);
  }
  return res.json();
}

// ── 거래내역 타입 ──
interface Transaction {
  date: string;        // 거래일자
  depositor: string;   // 입금자명
  amount: number;      // 입금액
  raw?: string;        // 원본 행
}

// ── 구분자 자동 감지 ──
function detectDelimiter(headerLine: string): string {
  // 세미콜론이 2개 이상이면 세미콜론 구분자 (신한은행 등)
  if ((headerLine.match(/;/g) || []).length >= 2) return ";";
  // 탭이 2개 이상이면 탭 구분자
  if ((headerLine.match(/\t/g) || []).length >= 2) return "\t";
  // 기본: 쉼표
  return ",";
}

/**
 * 거래내역 파싱 — 주요 은행 CSV/TXT 자동 인식
 *
 * 지원 형식:
 * - 신한은행: 세미콜론(;) 구분, 헤더 "거래일자;출금(원);입금(원);내용"
 * - 국민/우리/하나/농협: 쉼표(,) 구분
 * - 탭 구분 형식도 지원
 *
 * 입금자명 컬럼 매핑:
 * - 내용, 입금자명, 보내는분, 기재내용, 적요, 비고, 메모
 *
 * 금액 컬럼 매핑:
 * - 입금(원), 입금액, 입금, 거래금액, 금액
 */
function parseTransactions(text: string): Transaction[] {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const delimiter = detectDelimiter(headerLine);
  const headers = splitRow(headerLine, delimiter).map((h) => h.trim());

  // 컬럼 인덱스 탐색
  const dateIdx = headers.findIndex((h) =>
    /거래일|일자|날짜|date/i.test(h)
  );
  const depositorIdx = headers.findIndex((h) =>
    /^내용$|입금자|보내는\s*분|기재내용|적요|비고|메모|depositor|name/i.test(h)
  );
  const amountIdx = headers.findIndex((h) =>
    /입금\(원\)|입금액|^입금$|거래금액|금액|amount/i.test(h)
  );

  if (dateIdx === -1 || depositorIdx === -1 || amountIdx === -1) {
    throw new Error(
      `헤더를 인식할 수 없습니다. 필요한 컬럼: 거래일자, 입금자명(내용), 입금액\n` +
        `감지된 구분자: "${delimiter === "\t" ? "TAB" : delimiter}"\n` +
        `감지된 헤더: ${headers.join(" | ")}`
    );
  }

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitRow(lines[i], delimiter);
    if (cols.length <= Math.max(dateIdx, depositorIdx, amountIdx)) continue;

    const rawAmount = cols[amountIdx].replace(/[,원\s]/g, "");
    const amount = parseInt(rawAmount, 10);
    if (!amount || amount <= 0) continue; // 빈값 또는 출금 건 제외

    const depositor = cols[depositorIdx].trim();
    if (!depositor) continue;

    transactions.push({
      date: cols[dateIdx].trim(),
      depositor,
      amount,
      raw: lines[i],
    });
  }

  return transactions;
}

/** 구분자로 행 분할 (따옴표 내 구분자 처리) */
function splitRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── 이름 매칭 (유연한 비교) ──
function normalizeKoreanName(name: string): string {
  return name
    .replace(/\s+/g, "")       // 공백 제거
    .replace(/[^가-힣a-zA-Z0-9]/g, "") // 특수문자 제거
    .toLowerCase();
}

/**
 * 이름 매칭 로직
 * - 정확 일치: "홍길동" === "홍길동"
 * - 부분 포함: "홍길동촬영" includes "홍길동"
 * - 괄호 내용 제거 후 비교: "김성연(정이든)" → "김성연"
 * - 슬래시 분할: "김강남/오윤서" → "김강남" or "오윤서"
 */
function namesMatch(bankName: string, bookingName: string): boolean {
  const normalizedBooking = normalizeKoreanName(bookingName);
  if (!normalizedBooking) return false;

  // 은행 입금자명에서 괄호 내용 제거한 메인 이름
  const bankClean = bankName.replace(/\(.*?\)?$/, "").trim();
  // 괄호 안의 이름도 추출
  const parenMatch = bankName.match(/\(([^)]*)\)?/);
  const parenName = parenMatch ? parenMatch[1] : "";
  // 슬래시 분할
  const slashNames = bankClean.split("/").map((s) => s.trim());

  const candidates = [
    bankClean,
    parenName,
    ...slashNames,
  ]
    .map(normalizeKoreanName)
    .filter(Boolean);

  for (const candidate of candidates) {
    if (candidate === normalizedBooking) return true;
    if (candidate.includes(normalizedBooking)) return true;
    if (normalizedBooking.includes(candidate) && candidate.length >= 2) return true;
  }

  return false;
}

// ── 매칭 결과 타입 ──
interface MatchResult {
  transactionDate: string;
  depositor: string;
  amount: number;
  bookingId: string;
  bookingName: string;
  depositorName: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  autoConfirmed: boolean;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const autoConfirm = formData.get("autoConfirm") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다." },
        { status: 400 }
      );
    }

    // ── 1. 파일 파싱 ──
    const text = await file.text();
    let transactions: Transaction[];

    try {
      transactions = parseTransactions(text);
    } catch (parseErr: any) {
      return NextResponse.json(
        { error: parseErr.message },
        { status: 400 }
      );
    }

    if (transactions.length === 0) {
      return NextResponse.json(
        { error: "유효한 입금 거래내역이 없습니다." },
        { status: 400 }
      );
    }

    // ── 2. deposit_pending 상태인 예약 조회 ──
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
        message: "입금대기 중인 예약이 없습니다.",
        transactions: transactions.length,
        matched: [],
        unmatched: transactions.map((t) => ({
          depositor: t.depositor,
          amount: t.amount,
          date: t.date,
        })),
      });
    }

    // ── 3. 매칭 ──
    const matched: MatchResult[] = [];
    const unmatched: Transaction[] = [];
    const confirmedBookingIds = new Set<string>();

    for (const tx of transactions) {
      let found = false;

      for (const booking of pendingBookings) {
        if (confirmedBookingIds.has(booking.id)) continue;

        // depositor_name 또는 name으로 매칭
        const bookingDepositor = booking.depositor_name || booking.name;
        if (namesMatch(tx.depositor, bookingDepositor)) {
          const matchResult: MatchResult = {
            transactionDate: tx.date,
            depositor: tx.depositor,
            amount: tx.amount,
            bookingId: booking.id,
            bookingName: booking.name,
            depositorName: bookingDepositor,
            phone: booking.phone,
            date: booking.date,
            time: booking.time,
            location: booking.location || "스튜디오",
            autoConfirmed: false,
          };

          // 자동 확정 처리
          if (autoConfirm) {
            try {
              await confirmBooking(booking);
              matchResult.autoConfirmed = true;
              confirmedBookingIds.add(booking.id);
            } catch (confirmErr: any) {
              matchResult.error = confirmErr.message;
            }
          }

          matched.push(matchResult);
          found = true;
          break; // 1:1 매칭
        }
      }

      if (!found) {
        unmatched.push(tx);
      }
    }

    return NextResponse.json({
      success: true,
      transactions: transactions.length,
      matched,
      unmatched: unmatched.map((t) => ({
        depositor: t.depositor,
        amount: t.amount,
        date: t.date,
      })),
    });
  } catch (err: any) {
    console.error("deposit-match 에러:", err);
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ── 개별 예약 확정 처리 ──
async function confirmBooking(booking: any) {
  // 1. Supabase 상태 변경
  const { error } = await supabaseAdmin
    .from("booking_requests")
    .update({ status: "confirmed" })
    .eq("id", booking.id);

  if (error) throw new Error(`DB 업데이트 실패: ${error.message}`);

  // 2. Google Calendar 이벤트 업데이트
  if (booking.google_event_id) {
    try {
      await updateCalendarEvent(booking.google_event_id, {
        summary: `[확정] ${booking.name}`,
        colorId: CALENDAR_COLORS.confirmed,
        description: [
          `이름: ${booking.name}`,
          `전화: ${booking.phone}`,
          booking.depositor_name ? `입금자명: ${booking.depositor_name}` : "",
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

  // 3. 확정 문자 발송
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
  }
}