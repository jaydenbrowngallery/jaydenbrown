import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{
    name?: string;
    date?: string;
    phone?: string;
  }>;
};

export default async function AdminBookingPage({ searchParams }: Props) {
  const params = (await searchParams) || {};
  const name = params.name?.trim() || "";
  const date = params.date?.trim() || "";
  const phone = params.phone?.trim() || "";

  const { supabase } = await requireAdmin();

  let query = supabase
    .from("booking_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (name) {
    query = query.ilike("name", `%${name}%`);
  }

  if (date) {
    query = query.eq("date", date);
  }

  if (phone) {
    query = query.ilike("phone", `%${phone}%`);
  }

  const { data: requests, error } = await query;

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
          <Link
            href="/booking-private-jb2026"
            className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
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
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
          <p className="mt-1 text-sm text-black/45">
            총 {requests?.length ?? 0}건
          </p>
        </div>

        <Link
          href="/booking-private-jb2026"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
        >
          신청서 작성
        </Link>
      </div>

      <form className="mb-6 rounded-[24px] border border-black/10 bg-white p-4 md:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_180px_1fr_auto_auto]">
          <input
            type="text"
            name="name"
            defaultValue={name}
            placeholder="이름 검색"
            className="h-12 rounded-xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <input
            type="date"
            name="date"
            defaultValue={date}
            className="h-12 rounded-xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <input
            type="text"
            name="phone"
            defaultValue={phone}
            placeholder="전화번호 검색"
            className="h-12 rounded-xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <button
            type="submit"
            className="h-12 rounded-xl bg-black px-5 text-sm font-medium text-white hover:opacity-90"
          >
            검색
          </button>

          <Link
            href="/admin/booking"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-black/10 px-5 text-sm hover:bg-black/5"
          >
            초기화
          </Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-[28px] border border-black/10 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-black/10 bg-[#f7f5f2]">
            <tr>
              <th className="px-4 py-4 text-left font-semibold">신청일</th>
              <th className="px-4 py-4 text-left font-semibold">이름</th>
              <th className="px-4 py-4 text-left font-semibold">연락처</th>
              <th className="px-4 py-4 text-left font-semibold">제목</th>
              <th className="px-4 py-4 text-left font-semibold">날짜</th>
              <th className="px-4 py-4 text-left font-semibold">시간</th>
              <th className="px-4 py-4 text-left font-semibold">장소</th>
              <th className="px-4 py-4 text-left font-semibold">상태</th>
              <th className="px-4 py-4 text-left font-semibold">상세</th>
            </tr>
          </thead>

          <tbody>
            {requests?.map((item) => (
              <tr key={item.id} className="border-b border-black/10 last:border-b-0">
                <td className="px-4 py-4">
                  {item.created_at
                    ? new Date(item.created_at).toLocaleString("ko-KR")
                    : "-"}
                </td>

                <td className="px-4 py-4">{item.name ?? "-"}</td>
                <td className="px-4 py-4">{item.phone ?? "-"}</td>
                <td className="px-4 py-4">{item.title ?? "-"}</td>
                <td className="px-4 py-4">{item.date ?? "-"}</td>
                <td className="px-4 py-4">{item.time ?? "-"}</td>
                <td className="px-4 py-4">{item.location ?? "-"}</td>

                <td className="px-4 py-4">
                  {item.status === "confirmed" ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      접수완료
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                      접수대기
                    </span>
                  )}
                </td>

                <td className="px-4 py-4">
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
                <td
                  colSpan={9}
                  className="px-4 py-10 text-center text-sm text-black/40"
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}