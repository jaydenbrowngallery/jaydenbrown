"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DepositRow = {
  date: string;
  amount: number;
  name: string;
  rawName: string;
};

type BookingItem = {
  id: string;
  depositor_name: string | null;
  name: string | null;
  date: string | null;
  status: string | null;
};

type MatchResult = {
  deposit: DepositRow;
  booking: BookingItem;
};

function parseDepositorName(raw: string): string {
  // 괄호 앞 이름만 추출, 공백/특수문자 제거
  return raw.replace(/\(.*?\)/g, "").trim().split(/\s/)[0];
}

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, ""), 10) || 0;
}

function parseTxt(text: string): DepositRow[] {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: DepositRow[] = [];

  for (const line of lines) {
    // 헤더 스킵
    if (line.startsWith("거래일자")) continue;

    const parts = line.split(";");
    if (parts.length < 4) continue;

    const date = parts[0].trim();
    const amountRaw = parts[2].trim(); // 입금(원)
    const nameRaw = parts[3].trim();   // 내용

    if (!amountRaw || !nameRaw) continue;

    const amount = parseAmount(amountRaw);
    if (amount <= 0) continue;

    rows.push({
      date,
      amount,
      name: parseDepositorName(nameRaw),
      rawName: nameRaw,
    });
  }

  return rows;
}

export default function DepositMatcher({
  bookings,
}: {
  bookings: BookingItem[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unmatched, setUnmatched] = useState<DepositRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer;
      const decoder = new TextDecoder("euc-kr");
      const text = decoder.decode(buffer);
      const rows = parseTxt(text);
      setDeposits(rows);

      // 예약 리스트와 매칭
      const matched: MatchResult[] = [];
      const unmatched: DepositRow[] = [];

      for (const dep of rows) {
        const booking = bookings.find((b) => {
          const depositor = (b.depositor_name || b.name || "").trim();
          const parsed = parseDepositorName(depositor);
          return parsed === dep.name;
        });

        if (booking) {
          matched.push({ deposit: dep, booking });
        } else {
          unmatched.push(dep);
        }
      }

      setMatches(matched);
      setUnmatched(unmatched);
      setParsed(true);
      setDone(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = async () => {
    if (!matches.length) return;
    setProcessing(true);

    for (const m of matches) {
      await fetch("/api/booking/deposit-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: m.booking.id,
          deposit_amount: m.deposit.amount,
          status: "confirmed",
        }),
      });
    }

    setProcessing(false);
    setDone(true);
    router.refresh();
  };

  return (
    <div className="mb-6 rounded-[24px] border border-black/8 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-base font-semibold">입금 확인</h3>

      <div className="flex items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".txt"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-10 items-center rounded-full border border-black/10 bg-[#f7f5f2] px-5 text-sm font-medium transition hover:bg-black/5"
        >
          거래내역 파일 업로드
        </button>
        {parsed && (
          <span className="text-sm text-black/45">
            총 {deposits.length}건 파싱 · 매칭 {matches.length}건 · 미매칭 {unmatched.length}건
          </span>
        )}
      </div>

      {parsed && matches.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-black/70">매칭된 예약 ({matches.length}건)</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matches.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-2xl border border-black/5 bg-[#f7f5f2] px-4 py-3"
              >
                <div>
                  <span className="text-sm font-medium">{m.deposit.rawName}</span>
                  <span className="ml-2 text-xs text-black/45">{m.deposit.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-black/60">
                    {m.deposit.amount.toLocaleString()}원
                  </span>
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    매칭
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!done ? (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={processing}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {processing ? "처리 중..." : `${matches.length}건 확정 처리`}
            </button>
          ) : (
            <p className="mt-4 text-sm text-green-600 font-medium">✓ 확정 처리 완료</p>
          )}
        </div>
      )}

      {parsed && unmatched.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-black/45">미매칭 ({unmatched.length}건)</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {unmatched.map((d, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-black/5 bg-[#fafaf8] px-4 py-2"
              >
                <span className="text-sm text-black/50">{d.rawName}</span>
                <span className="text-xs text-black/35">{d.amount.toLocaleString()}원</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
