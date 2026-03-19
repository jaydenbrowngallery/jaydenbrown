import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import BookingListTable from "./BookingListTable";

export const dynamic = "force-dynamic";

type BookingRequest = {
  id: string;
  created_at?: string | null;
  title?: string | null;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  status?: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
    keyword?: string;
    phone?: string;
    date?: string;
    status?: string;
  }>;
};

function formatTimeSlot(slot?: string | null) {
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

function getTimeSlotBadgeClass(slot?: string | null) {
  switch (slot) {
    case "1부":
      return "bg-blue-100 text-blue-700";
    case "2부":
      return "bg-amber-100 text-amber-700";
    case "3부":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getStatusText(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "확정";
    case "cancelled":
      return "취소";
    default:
      return "대기";
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getMonthCalendarData(
  requests: BookingRequest[],
  year: number,
  month: number
) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startWeekday = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const dateMap = new Map<string, BookingRequest[]>();

  for (const item of requests) {
    if (!item.date) continue;
    if (!dateMap.has(item.date)) {
      dateMap.set(item.date, []);
    }
    dateMap.get(item.date)!.push(item);
  }

  const cells: Array<{
    key: string;
    day?: number;
    dateString?: string;
    items: BookingRequest[];
  }> = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({
      key: `empty-start-${i}`,
      items: [],
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const mm = String(month).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const dateString = `${year}-${mm}-${dd}`;

    const items = (dateMap.get(dateString) ?? []).sort((a, b) => {
      const order = { "1부": 1, "2부": 2, "3부": 3 } as Record<string, number>;
      return (order[a.time || ""] ?? 99) - (order[b.time || ""] ?? 99);
    });

    cells.push({
      key: dateString,
      day,
      dateString,
      items,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-end-${cells.length}`,
      items: [],
    });
  }

  return {
    year,
    month,
    cells,
  };
}

function getPrevMonth(year: number, month: number) {
  if (month === 1) {
    return { year: year - 1, month: 12 };
  }
  return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number) {
  if (month === 12) {
    return { year: year + 1, month: 1 };
  }
  return { year, month: month + 1 };
}

function buildMonthLink(
  year: number,
  month: number,
  keyword: string,
  phone: string,
  date: string,
  status: string
) {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month));
  if (keyword) params.set("keyword", keyword);
  if (phone) params.set("phone", phone);
  if (date) params.set("date", date);
  if (status) params.set("status", status);

  return `/admin/booking?${params.toString()}`;
}

export default async function AdminBookingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const now = new Date();

  const selectedYear = Number(resolvedSearchParams.year) || now.getFullYear();
  const selectedMonth = Number(resolvedSearchParams.month) || now.getMonth() + 1;

  const keyword = resolvedSearchParams.keyword?.trim() || "";
  const phone = resolvedSearchParams.phone?.trim() || "";
  const date = resolvedSearchParams.date?.trim() || "";
  const status = resolvedSearchParams.status?.trim() || "";

  const { supabase } = await requireAdmin();

  async function deleteSelectedAction(formData: FormData) {
    "use server";

    const selectedIds = formData
      .getAll("selectedIds")
      .map((value) => String(value))
      .filter(Boolean);

    if (!selectedIds.length) return;

    const { supabase } = await requireAdmin();
    const { error } = await supabase
      .from("booking_requests")
      .delete()
      .in("id", selectedIds);

    if (error) {
      throw new Error(`선택 삭제 실패: ${error.message}`);
    }

    revalidatePath("/admin/booking");
  }

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

  const allRequests = (requests ?? []) as BookingRequest[];

  const filteredRequests = allRequests.filter((item) => {
    const matchKeyword = keyword
      ? (item.name || "").toLowerCase().includes(keyword.toLowerCase())
      : true;

    const matchPhone = phone ? (item.phone || "").includes(phone) : true;
    const matchDate = date ? item.date === date : true;
    const matchStatus = status ? (item.status || "pending") === status : true;

    return matchKeyword && matchPhone && matchDate && matchStatus;
  });

  const pendingRequests = filteredRequests.filter(
    (item) => (item.status || "pending") === "pending"
  );

  const calendar = getMonthCalendarData(
    filteredRequests,
    selectedYear,
    selectedMonth
  );
  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const prev = getPrevMonth(selectedYear, selectedMonth);
  const next = getNextMonth(selectedYear, selectedMonth);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">예약 신청서 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            검색 결과 {filteredRequests.length}건 / 전체 {allRequests.length}건
          </p>
        </div>

        <form
          action="/admin/booking"
          method="get"
          className="grid w-full grid-cols-1 gap-3 md:w-auto md:grid-cols-5"
        >
          <input type="hidden" name="year" value={selectedYear} />
          <input type="hidden" name="month" value={selectedMonth} />

          <input
            type="text"
            name="keyword"
            defaultValue={keyword}
            placeholder="이름 검색"
            className="h-11 rounded-xl border border-black/10 px-4 outline-none"
          />

          <input
            type="text"
            name="phone"
            defaultValue={phone}
            placeholder="연락처 검색"
            className="h-11 rounded-xl border border-black/10 px-4 outline-none"
          />

          <input
            type="date"
            name="date"
            defaultValue={date}
            className="h-11 rounded-xl border border-black/10 px-4 outline-none"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-11 rounded-xl border border-black/10 px-4 outline-none"
          >
            <option value="">상태 전체</option>
            <option value="pending">대기</option>
            <option value="confirmed">확정</option>
            <option value="cancelled">취소</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-11 rounded-xl bg-black px-4 text-sm text-white hover:opacity-90"
            >
              검색
            </button>

            <Link
              href={`/admin/booking?year=${selectedYear}&month=${selectedMonth}`}
              className="inline-flex h-11 items-center rounded-xl border border-black/10 px-4 text-sm hover:bg-black/5"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">대기 중 예약</h2>
          <p className="text-sm text-gray-500">{pendingRequests.length}건</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="divide-y">
            {pendingRequests.length ? (
              pendingRequests.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/booking/${item.id}`}
                  className="flex flex-col gap-2 px-5 py-4 hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                      대기
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${getTimeSlotBadgeClass(
                        item.time
                      )}`}
                    >
                      {item.date ?? "-"} / {formatTimeSlot(item.time)}
                    </span>
                    <span className="font-medium">{item.name ?? "-"}</span>
                    <span className="text-sm text-black/50">
                      {item.phone ?? "-"}
                    </span>
                  </div>

                  <div className="text-sm text-black/55">
                    {item.location ?? "-"}
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-gray-500">
                대기 중 예약이 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold">예약 스케줄 캘린더</h2>

          <div className="flex items-center gap-2">
            <Link
              href={buildMonthLink(
                prev.year,
                prev.month,
                keyword,
                phone,
                date,
                status
              )}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
            >
              이전달
            </Link>

            <div className="min-w-[140px] text-center text-sm font-medium text-black/70">
              {calendar.year}년 {calendar.month}월
            </div>

            <Link
              href={buildMonthLink(
                next.year,
                next.month,
                keyword,
                phone,
                date,
                status
              )}
              className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
            >
              다음달
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">
            1부(12시)
          </span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">
            2부(14시30분)
          </span>
          <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-700">
            3부(16시)
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            대기
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-700">
            확정
          </span>
          <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">
            취소
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="grid grid-cols-7 border-b bg-gray-50 text-sm font-semibold">
            {weekLabels.map((label) => (
              <div key={label} className="px-3 py-3 text-center">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {calendar.cells.map((cell, index) => (
              <div
                key={cell.key}
                className={`min-h-[170px] border-b border-r p-2 align-top ${
                  index % 7 === 6 ? "border-r-0" : ""
                }`}
              >
                {cell.day ? (
                  <>
                    <div className="mb-2 text-sm font-semibold">{cell.day}</div>

                    <div className="space-y-2">
                      {cell.items.slice(0, 4).map((item) => (
                        <Link
                          key={item.id}
                          href={`/admin/booking/${item.id}`}
                          className="block rounded-xl border border-black/5 bg-[#f7f5f2] p-2 hover:bg-[#efebe5]"
                        >
                          <div className="mb-1 flex flex-wrap items-center gap-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTimeSlotBadgeClass(
                                item.time
                              )}`}
                            >
                              {formatTimeSlot(item.time)}
                            </span>

                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(
                                item.status
                              )}`}
                            >
                              {getStatusText(item.status)}
                            </span>
                          </div>

                          <div className="truncate text-xs font-semibold">
                            {item.name ?? "-"}
                          </div>
                          <div className="truncate text-[11px] text-black/55">
                            {item.location ?? "-"}
                          </div>
                        </Link>
                      ))}

                      {cell.items.length > 4 && (
                        <div className="px-1 text-xs text-black/45">
                          + {cell.items.length - 4}건 더 있음
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

  <BookingListTable items={filteredRequests} />
    </main>
  );
}