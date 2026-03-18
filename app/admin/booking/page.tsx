import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminBookingPage() {
  const { supabase } = await requireAdmin();

  const { data: requests, error } = await supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
          <Link
            href="/booking-private-jb2026"
            className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-80"
          >
            신청서 작성
          </Link>
        </div>

        <p className="text-red-500">
          데이터를 불러오지 못했습니다: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            총 {requests?.length ?? 0}건
          </p>
        </div>

        <Link
          href="/booking-private-jb2026"
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:opacity-80"
        >
          신청서 작성
        </Link>
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
                <td className="px-4 py-3">{item.time ?? "-"}</td>
                <td className="px-4 py-3">{item.location ?? "-"}</td>
                <td className="px-4 py-3">
                  <Link
  href={`/admin/booking/${item.id}`}
  className="text-sm text-black/50 hover:text-black"
>
  보기
</Link>
                </td>
              </tr>
            ))}

            {!requests?.length && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
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