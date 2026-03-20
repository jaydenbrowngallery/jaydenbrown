"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// ────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────
type BookingListItem = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  status?: string | null;
  depositor_name?: string | null;
  source?: "booking" | "calendar";
  detailHref?: string | null;
};

type DepositRow = {
  date: string;
  amount: number;
  name: string;
  rawName: string;
};

type MatchResult = {
  deposit: DepositRow;
  booking: BookingListItem;
  alreadyConfirmed: boolean;
};

// ────────────────────────────────────────────
// 유틸
// ────────────────────────────────────────────
const ITEMS_PER_PAGE = 30;

function parseDepositorName(raw: string): string {
  return raw.replace(/\(.*?\)/g, "").trim().split(/\s/)[0];
}

function parseAmount(raw: string): number {
  return parseInt(raw.replace(/,/g, ""), 10) || 0;
}

function parseTxt(text: string): DepositRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: DepositRow[] = [];
  for (const line of lines) {
    if (line.startsWith("거래일자")) continue;
    const parts = line.split(";");
    if (parts.length < 4) continue;
    const date = parts[0].trim();
    const amountRaw = parts[2].trim();
    const nameRaw = parts[3].trim();
    if (!amountRaw || !nameRaw) continue;
    const amount = parseAmount(amountRaw);
    if (amount <= 0) continue;
    rows.push({ date, amount, name: parseDepositorName(nameRaw), rawName: nameRaw });
  }
  return rows;
}

function formatTimeSlot(slot?: string | null) {
  switch (slot) {
    case "1부": return "1부(12시)";
    case "2부": return "2부(14시30분)";
    case "3부": return "3부(16시)";
    default: return slot || "-";
  }
}

function formatCreatedAt(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getMonth() + 1}. ${date.getDate()}.`;
}

function formatStatus(status?: string | null, source?: string | null, depositMatched?: boolean) {
  if (source === "calendar") {
    return <span className="inline-block h-2 w-2 rounded-full bg-[#c7a77a]" title="기존 캘린더 일정" />;
  }
  return (
    <div className="flex flex-col gap-1">
      {depositMatched && (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
          입금확인
        </span>
      )}
      {status === "confirmed" && <span className="text-green-600 text-xs">확정</span>}
      {status === "cancelled" && <span className="text-red-500 text-xs">취소</span>}
      {!status || status === "pending" ? <span className="text-gray-400 text-xs">대기</span> : null}
    </div>
  );
}

// ────────────────────────────────────────────
// 메인 컴포넌트
// ────────────────────────────────────────────
export default function BookingClientSection({ items }: { items: BookingListItem[] }) {
  const router = useRouter();

  // 입금 매칭 상태
  const fileRef = useRef<HTMLInputElement>(null);
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [unmatched, setUnmatched] = useState<DepositRow[]>([]);
  const [parsed, setParsed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // 매칭된 예약 ID set
  const matchedIds = useMemo(() => new Set(matches.map((m) => m.booking.id)), [matches]);

  // 테이블 상태
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [items]);

  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  }, [items, currentPage]);

  const currentPageBookingIds = useMemo(
    () => pagedItems.filter((i) => (i.source || "booking") === "booking").map((i) => i.id),
    [pagedItems]
  );

  const isAllSelected = useMemo(
    () => currentPageBookingIds.length > 0 && currentPageBookingIds.every((id) => selectedIds.includes(id)),
    [currentPageBookingIds, selectedIds]
  );

  const toggleAll = () => {
    if (isAllSelected) {
      setSelectedIds((prev) => prev.filter((id) => !currentPageBookingIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...currentPageBookingIds])));
    }
  };

  const toggleOne = (id: string, source?: string | null) => {
    if ((source || "booking") !== "booking") return;
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) { alert("삭제할 항목을 선택해 주세요."); return; }
    if (!window.confirm(`선택한 ${selectedIds.length}건을 삭제할까요?`)) return;
    try {
      setDeleting(true);
      const res = await fetch("/api/booking/delete-selected", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const result = await res.json();
      if (!res.ok || !result.ok) { alert(result.message || "선택 삭제에 실패했습니다."); return; }
      setSelectedIds([]);
      alert("선택한 예약이 삭제되었습니다.");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("선택 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  // 파일 업로드
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseTxt(text);
      setDeposits(rows);

      const matched: MatchResult[] = [];
      const unmatchedList: DepositRow[] = [];

      for (const dep of rows) {
        const booking = items.find((b) => {
          if ((b.source || "booking") !== "booking") return false;
          const depositor = (b.depositor_name || b.name || "").trim();
          return parseDepositorName(depositor) === dep.name;
        });

        if (booking) {
          matched.push({ deposit: dep, booking, alreadyConfirmed: booking.status === "confirmed" });
        } else {
          unmatchedList.push(dep);
        }
      }

      setMatches(matched);
      setUnmatched(unmatchedList);
      setParsed(true);
      setDone(false);
    };
    reader.readAsText(file, "utf-8");
  };

  const handleConfirm = async () => {
    const toProcess = matches.filter((m) => !m.alreadyConfirmed);
    if (!toProcess.length) return;
    setProcessing(true);
    for (const m of toProcess) {
      await fetch("/api/booking/deposit-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: m.booking.id, deposit_amount: m.deposit.amount, status: "confirmed" }),
      });
    }
    setProcessing(false);
    setDone(true);
    router.refresh();
  };

  const newMatches = matches.filter((m) => !m.alreadyConfirmed);

  return (
    <div>
      {/* ── 입금 확인 섹션 ── */}
      <div className="mb-6 rounded-[24px] border border-black/8 bg-white p-5 shadow-sm">
        <h3 className="mb-3 text-base font-semibold">입금 확인</h3>
        <div className="flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept=".txt" onChange={handleFile} className="hidden" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex h-10 items-center rounded-full border border-black/10 bg-[#f7f5f2] px-5 text-sm font-medium transition hover:bg-black/5"
          >
            거래내역 파일 업로드
          </button>
          {parsed && (
            <span className="text-sm text-black/45">
              총 {deposits.length}건 · 매칭 {matches.length}건 · 신규 {newMatches.length}건 · 미매칭 {unmatched.length}건
            </span>
          )}
        </div>

        {parsed && matches.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-black/70">매칭된 예약 ({matches.length}건) — 리스트에 파란색으로 표시됩니다</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 ${m.alreadyConfirmed ? "border-green-100 bg-green-50" : "border-blue-100 bg-blue-50"}`}>
                  <div>
                    <span className="text-sm font-medium">{m.deposit.rawName}</span>
                    <span className="ml-2 text-xs text-black/45">{m.deposit.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black/60">{m.deposit.amount.toLocaleString()}원</span>
                    {m.alreadyConfirmed
                      ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">이미 확정</span>
                      : <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">신규</span>
                    }
                  </div>
                </div>
              ))}
            </div>
            {!done ? (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={processing || newMatches.length === 0}
                className="mt-3 inline-flex h-10 items-center rounded-full bg-black px-6 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
              >
                {processing ? "처리 중..." : `신규 ${newMatches.length}건 확정 처리`}
              </button>
            ) : (
              <p className="mt-3 text-sm font-medium text-green-600">✓ 확정 처리 완료</p>
            )}
          </div>
        )}

        {parsed && unmatched.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-black/45">미매칭 ({unmatched.length}건)</p>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {unmatched.map((d, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-black/5 bg-[#fafaf8] px-4 py-2">
                  <span className="text-sm text-black/50">{d.rawName}</span>
                  <span className="text-xs text-black/35">{d.amount.toLocaleString()}원</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 예약 리스트 테이블 ── */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
              </th>
              <th className="px-4 py-3 text-left font-semibold">구분</th>
              <th className="px-4 py-3 text-left font-semibold">신청일</th>
              <th className="px-4 py-3 text-left font-semibold">이름</th>
              <th className="px-4 py-3 text-left font-semibold">연락처</th>
              <th className="px-4 py-3 text-left font-semibold">제목</th>
              <th className="px-4 py-3 text-left font-semibold">날짜</th>
              <th className="px-4 py-3 text-left font-semibold">시간</th>
              <th className="px-4 py-3 text-left font-semibold">장소</th>
              <th className="px-4 py-3 text-left font-semibold">상태</th>
            </tr>
          </thead>
          <tbody>
            {pagedItems.map((item) => {
              const source = item.source || "booking";
              const isBooking = source === "booking";
              const href = item.detailHref || (isBooking ? `/admin/booking/${item.id}` : null);
              const depositMatched = matchedIds.has(item.id);

              return (
                <tr
                  key={`${source}-${item.id}`}
                  className={`border-b last:border-b-0 ${depositMatched ? "bg-blue-50/50" : ""}`}
                >
                  <td className="px-4 py-3">
                    {isBooking ? (
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id, item.source)} />
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {isBooking
                      ? <span className="inline-flex h-2 w-2 rounded-full bg-black/45" />
                      : <span className="inline-flex h-2 w-2 rounded-full bg-[#c7a77a]" title="기존 캘린더 일정" />
                    }
                  </td>
                  <td className="px-4 py-3">{formatCreatedAt(item.created_at)}</td>
                  <td className="px-4 py-3">
                    {href ? (
                      <Link href={href} className="font-medium text-black transition hover:text-black/60">
                        {item.name ?? "-"}
                      </Link>
                    ) : (item.name ?? "-")}
                  </td>
                  <td className="px-4 py-3">{item.phone ?? "-"}</td>
                  <td className="px-4 py-3">
                    {href ? (
                      <Link href={href} className="font-medium text-black transition hover:text-black/60">
                        {item.title ?? "-"}
                      </Link>
                    ) : (item.title ?? "-")}
                  </td>
                  <td className="px-4 py-3">{item.date ?? "-"}</td>
                  <td className="px-4 py-3">{formatTimeSlot(item.time)}</td>
                  <td className="px-4 py-3">{item.location ?? "-"}</td>
                  <td className="px-4 py-3">{formatStatus(item.status, item.source, depositMatched)}</td>
                </tr>
              );
            })}
            {!pagedItems.length && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-gray-500">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-gray-500">페이지 {currentPage} / {totalPages}</p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
            className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40">
            이전
          </button>
          <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
            className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium text-black transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40">
            다음
          </button>
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button type="button" onClick={handleDeleteSelected} disabled={selectedIds.length === 0 || deleting}
          className="rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black/60 transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-40">
          {deleting ? "삭제 중..." : "선택 삭제"}
        </button>
      </div>
    </div>
  );
}
