"use client";

import { useState, useEffect, useCallback } from "react";

// ── 타입 ──
interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  location: string;
  depositor_name: string;
  deposit_amount: number | null;
  status: string;
  created_at: string;
  google_event_id: string | null;
}

interface MatchedItem {
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

interface UnmatchedItem {
  depositor: string;
  amount: number;
  date: string;
}

interface MatchResponse {
  success: boolean;
  transactions: number;
  matched: MatchedItem[];
  unmatched: UnmatchedItem[];
  error?: string;
  message?: string;
}

// ── 상태 뱃지 컴포넌트 ──
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; bg: string; text: string }> = {
    pending: {
      label: "대기",
      bg: "bg-gray-100",
      text: "text-gray-700",
    },
    deposit_pending: {
      label: "입금대기",
      bg: "bg-amber-50",
      text: "text-amber-700",
    },
    confirmed: {
      label: "확정",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
    },
    cancelled: {
      label: "취소",
      bg: "bg-red-50",
      text: "text-red-700",
    },
  };

  const c = config[status] || {
    label: status,
    bg: "bg-gray-100",
    text: "text-gray-600",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
    >
      {c.label}
    </span>
  );
}

// ── 메인 컴포넌트 ──
export default function DepositManagementPage() {
  // 예약 목록
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<string>("deposit_pending");

  // 파일 업로드
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
  const [autoConfirm, setAutoConfirm] = useState(false);

  // 수동 확정
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  // ── 예약 목록 로드 ──
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      // Supabase REST로 직접 조회 (관리자 페이지이므로 서버 API 사용 권장)
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);

      const res = await fetch(`/api/bookings?${params}`);
      if (!res.ok) throw new Error("예약 목록 조회 실패");
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingBookings(false);
    }
  }, [filter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // ── 파일 업로드 & 매칭 ──
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMatchResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("autoConfirm", autoConfirm.toString());

      const res = await fetch("/api/deposit-match", {
        method: "POST",
        body: formData,
      });

      const data: MatchResponse = await res.json();
      setMatchResult(data);

      if (data.success && autoConfirm && data.matched.length > 0) {
        loadBookings(); // 확정된 항목 반영
      }
    } catch (err: any) {
      setMatchResult({
        success: false,
        transactions: 0,
        matched: [],
        unmatched: [],
        error: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  // ── 수동 확정 ──
  const handleManualConfirm = async (bookingId: string) => {
    if (!confirm("이 예약을 확정하시겠습니까?\n확정 문자가 발송됩니다."))
      return;

    setConfirmingId(bookingId);
    try {
      const res = await fetch("/api/deposit-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message);
        loadBookings();
      } else {
        alert(`오류: ${data.error}`);
      }
    } catch (err: any) {
      alert(`오류: ${err.message}`);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* ── 헤더 ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">입금 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            거래내역 업로드 → 입금자 자동 매칭 → 예약 확정
          </p>
        </div>

        {/* ── 거래내역 업로드 섹션 ── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            거래내역 업로드
          </h2>

          <div className="space-y-4">
            {/* 파일 선택 */}
            <div className="flex items-center gap-4">
              <label className="flex-1">
                <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
                  <div className="text-center">
                    <svg
                      className="mx-auto h-8 w-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">
                      {file ? file.name : "CSV 파일을 선택하세요"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      국민·신한·우리·하나·농협 등 은행 거래내역 CSV
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept=".csv,.txt"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            {/* 옵션 & 버튼 */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">
                  매칭 시 자동 확정 (확정 문자 즉시 발송)
                </span>
              </label>

              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "처리 중..." : "업로드 & 매칭"}
              </button>
            </div>
          </div>

          {/* ── 매칭 결과 ── */}
          {matchResult && (
            <div className="mt-6 space-y-4">
              {matchResult.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{matchResult.error}</p>
                </div>
              ) : (
                <>
                  {/* 요약 */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900">
                        {matchResult.transactions}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">전체 거래</p>
                    </div>
                    <div className="p-4 bg-emerald-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-emerald-700">
                        {matchResult.matched.length}
                      </p>
                      <p className="text-xs text-emerald-600 mt-1">매칭 성공</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <p className="text-2xl font-bold text-amber-700">
                        {matchResult.unmatched.length}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">미매칭</p>
                    </div>
                  </div>

                  {/* 매칭 목록 */}
                  {matchResult.matched.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        매칭 결과
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                입금자
                              </th>
                              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                금액
                              </th>
                              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                예약자
                              </th>
                              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                예약일시
                              </th>
                              <th className="text-left py-2 px-3 text-gray-500 font-medium">
                                상태
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchResult.matched.map((m, i) => (
                              <tr
                                key={i}
                                className="border-b border-gray-100"
                              >
                                <td className="py-2 px-3">{m.depositor}</td>
                                <td className="py-2 px-3">
                                  {m.amount.toLocaleString()}원
                                </td>
                                <td className="py-2 px-3">
                                  {m.bookingName}
                                </td>
                                <td className="py-2 px-3">
                                  {m.date} {m.time}
                                </td>
                                <td className="py-2 px-3">
                                  {m.autoConfirmed ? (
                                    <span className="text-emerald-600 font-medium">
                                      ✅ 확정 완료
                                    </span>
                                  ) : m.error ? (
                                    <span className="text-red-600 text-xs">
                                      ❌ {m.error}
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleManualConfirm(m.bookingId)
                                      }
                                      className="text-xs px-3 py-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
                                    >
                                      확정
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* 미매칭 목록 */}
                  {matchResult.unmatched.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">
                        미매칭 거래
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-gray-500">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 font-medium">
                                입금자
                              </th>
                              <th className="text-left py-2 px-3 font-medium">
                                금액
                              </th>
                              <th className="text-left py-2 px-3 font-medium">
                                거래일
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {matchResult.unmatched.map((u, i) => (
                              <tr
                                key={i}
                                className="border-b border-gray-100"
                              >
                                <td className="py-2 px-3">{u.depositor}</td>
                                <td className="py-2 px-3">
                                  {u.amount.toLocaleString()}원
                                </td>
                                <td className="py-2 px-3">{u.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        {/* ── 예약 목록 섹션 ── */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">예약 목록</h2>

            <div className="flex gap-2">
              {[
                { value: "deposit_pending", label: "입금대기" },
                { value: "confirmed", label: "확정" },
                { value: "pending", label: "접수" },
                { value: "all", label: "전체" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filter === f.value
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {loadingBookings ? (
            <div className="py-12 text-center text-gray-400">로딩 중...</div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center text-gray-400">
              해당 상태의 예약이 없습니다.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      예약자
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      입금자명
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      연락처
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      예약일시
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      장소
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      상태
                    </th>
                    <th className="text-left py-3 px-3 text-gray-500 font-medium">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-3 font-medium text-gray-900">
                        {b.name}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {b.depositor_name || "-"}
                      </td>
                      <td className="py-3 px-3 text-gray-600">{b.phone}</td>
                      <td className="py-3 px-3 text-gray-600">
                        {b.date} {b.time}
                      </td>
                      <td className="py-3 px-3 text-gray-600">
                        {b.location || "-"}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="py-3 px-3">
                        {b.status === "deposit_pending" && (
                          <button
                            onClick={() => handleManualConfirm(b.id)}
                            disabled={confirmingId === b.id}
                            className="text-xs px-3 py-1.5 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {confirmingId === b.id
                              ? "처리 중..."
                              : "수동 확정"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
