import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

// 🔥 시간 표시 변환
function formatTimeSlot(slot: string) {
  switch (slot) {
    case "1부":
      return "1부(12시)";
    case "2부":
      return "2부(14시30분)";
    case "3부":
      return "3부(16시)";
    default:
      return slot || "-";
  }
}

// 🔥 상태 표시 스타일
function formatStatus(status: string) {
  switch (status) {
    case "confirmed":
      return <span className="text-green-600">확정</span>;
    case "cancelled":
      return <span className="text-red-500">취소</span>;
    default:
      return <span className="text-gray-400">대기</span>;
  }
}

export default async function AdminBookingPage() {
  const { supabase } = await requireAdmin();

  const { data: requests, error } = await supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-bold">예약 신청서 관리</h1>
        <p className="text-red-500">
          데이터를 불러오지 못했습니다: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
        <p className="text-sm text-gray-500">총 {requests?.length ?? 0}건</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">신청일</th>
              <th className="px-4 py-3 text-left font-semibold">이름</th>
              <th className="px-4 py-3 text-left font-semibold">연락처</th>
              <th className="px-4 py-3 text-left font-semibold">제목</th>
              <th className="px-4 py-3 text-left font-semibold">날짜</th>
              <th className="px-4 py-3 text-left font-semibold">시간</th>
              <th className="px-4 py-3 text-left font-semibold">장소</th>
              <th className="px-4 py-3 text-left font-semibold">상태</th>
              <th className="px-4 py-3 text-left font-semibold">상세</th>
            </tr>
          </thead>

          <tbody>
            {requests?.map((item) => (
              <tr key={item.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("ko-KR")
                    : "-"}
                </td>

                <td className="px-4 py-3">{item.name ?? "-"}</td>
                <td className="px-4 py-3">{item.phone ?? "-"}</td>
                <td className="px-4 py-3">{item.title ?? "-"}</td>
                <td className="px-4 py-3">{item.date ?? "-"}</td>

                {/* 🔥 시간 변환 적용 */}
                <td className="px-4 py-3">
                  {formatTimeSlot(item.time)}
                </td>

                <td className="px-4 py-3">{item.location ?? "-"}</td>

                {/* 🔥 상태 표시 */}
                <td className="px-4 py-3">
                  {formatStatus(item.status)}
                </td>

                <td className="px-4 py-3">
                  <Link
                    href={`/admin/booking/${item.id}`}
                    className="inline-flex rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    보기
                  </Link>
                </td>
              </tr>
            ))}

            {!requests?.length && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                  신청서가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
