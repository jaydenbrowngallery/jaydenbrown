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

type CalendarEvent = {
  id: string;
  created_at?: string | null;
  external_id?: string | null;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  source?: string | null;
};

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
  source?: "booking" | "calendar";
  detailHref?: string | null;
};

type PageProps = {
  searchParams?: Promise<{
    year?: string;
    month?: string;
    keyword?: string;
    phone?: string;
    date?: string;
    status?: string;
    selectedDate?: string;
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

function getCalendarEventDateKey(startAt?: string | null) {
  if (!startAt) return null;

  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return null;

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function formatCalendarEventTime(startAt?: string | null) {
  if (!startAt) return "";

  const date = new Date(startAt);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getExternalEventsMap(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();

  for (const item of events) {
    const key = getCalendarEventDateKey(item.start_at);
    if (!key) continue;

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(item);
  }

  for (const [key, value] of map.entries()) {
    value.sort((a, b) => {
      const aTime = a.start_at ? new Date(a.start_at).getTime() : 0;
      const bTime = b.start_at ? new Date(b.start_at).getTime() : 0;
      return aTime - bTime;
    });
    map.set(key, value);
  }

  return map;
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
  status: string,
  selectedDate?: string
) {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month));
  if (keyword) params.set("keyword", keyword);
  if (phone) params.set("phone", phone);
  if (date) params.set("date", date);
  if (status) params.set("status", status);
  if (selectedDate) params.set("selectedDate", selectedDate);

  return `/admin/booking?${params.toString()}`;
}

function buildSelectedDateLink(
  targetDate: string,
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
  params.set("selectedDate", targetDate);
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
  const selectedMonth =
    Number(resolvedSearchParams.month) || now.getMonth() + 1;

  const keyword = resolvedSearchParams.keyword?.trim() || "";
  const phone = resolvedSearchParams.phone?.trim() || "";
  const date = resolvedSearchParams.date?.trim() || "";
  const status = resolvedSearchParams.status?.trim() || "";
  const selectedDate = resolvedSearchParams.selectedDate?.trim() || "";

  const { supabase } = await requireAdmin();

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1, 0, 0, 0, 0);
  const monthEnd = new Date(selectedYear, selectedMonth, 1, 0, 0, 0, 0);

  const [
    { data: requests, error },
    { data: calendarEvents, error: calendarError },
  ] = await Promise.all([
    supabase.from("booking_requests").select("*").order("created_at", {
      ascending: false,
    }),
    supabase
      .from("calendar_events")
      .select("*")
      .gte("start_at", monthStart.toISOString())
      .lt("start_at", monthEnd.toISOString())
      .order("start_at", { ascending: true }),
  ]);

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h1 className="mb-6 text-2xl font-bold">예약 신청서 관리</h1>
        <p className="text-red-500">
          데이터를 불러오지 못했습니다: {error.message}
        </p>
      </main>
    );
  }

  if (calendarError) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <h1 className="mb-6 text-2xl font-bold">예약 신청서 관리</h1>
        <p className="text-red-500">
          캘린더 일정을 불러오지 못했습니다: {calendarError.message}
        </p>
      </main>
    );
  }

  const allRequests = (requests ?? []) as BookingRequest[];
  const importedCalendarEvents = (calendarEvents ?? []) as CalendarEvent[];

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
  const externalEventsMap = getExternalEventsMap(importedCalendarEvents);

  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];

  const prev = getPrevMonth(selectedYear, selectedMonth);
  const next = getNextMonth(selectedYear, selectedMonth);

  const today = new Date();
  const todayString = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const bookingListItems: BookingListItem[] = filteredRequests.map((item) => ({
    id: item.id,
    created_at: item.created_at,
    title: item.title,
    name: item.name,
    phone: item.phone,
    date: item.date,
    time: item.time,
    location: item.location,
    status: item.status,
    source: "booking",
    detailHref: `/admin/booking/${item.id}`,
  }));

  const calendarListItems: BookingListItem[] = importedCalendarEvents.map(
    (item) => {
      const startDate = item.start_at ? new Date(item.start_at) : null;

      const dateString =
        startDate && !Number.isNaN(startDate.getTime())
          ? `${startDate.getFullYear()}-${String(
              startDate.getMonth() + 1
            ).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`
          : null;

      const timeString =
        startDate && !Number.isNaN(startDate.getTime())
          ? new Intl.DateTimeFormat("ko-KR", {
              hour: "numeric",
              minute: "2-digit",
              hour12: false,
            }).format(startDate)
          : null;

      return {
        id: item.id,
        created_at: item.created_at ?? item.start_at ?? null,
        title: item.title ?? "제목 없음",
        name: "기존 캘린더 일정",
        phone: "-",
        date: dateString,
        time: timeString,
        location: item.location ?? "-",
        status: "calendar",
        source: "calendar",
        detailHref: `/admin/booking/calendar/${item.id}`,
      };
    }
  );

  const mergedListItems = [...calendarListItems, ...bookingListItems].sort(
    (a, b) => {
      const aHasDate = !!a.date;
      const bHasDate = !!b.date;

      if (!aHasDate && !bHasDate) return 0;
      if (!aHasDate) return 1;
      if (!bHasDate) return -1;

      const aDateTime = `${a.date}T${
        a.time && a.time !== "-" ? a.time : "00:00"
      }:00`;
      const bDateTime = `${b.date}T${
        b.time && b.time !== "-" ? b.time : "00:00"
      }:00`;

      const aTime = new Date(aDateTime).getTime();
      const bTime = new Date(bDateTime).getTime();

      return bTime - aTime;
    }
  );

  const selectedDateBookingItems = selectedDate
    ? filteredRequests.filter((item) => item.date === selectedDate)
    : [];

  const selectedDateExternalItems = selectedDate
    ? externalEventsMap.get(selectedDate) ?? []
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
      <div className="mb-8 rounded-[28px] bg-white p-5 shadow-sm md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              예약 신청서 관리
            </h1>
            <p className="mt-2 text-sm text-black/45">
              검색 결과 {filteredRequests.length}건 / 전체 {allRequests.length}건
            </p>
          </div>

          <Link
            href="/booking-private-jb2026"
            className="inline-flex h-12 items-center justify-center rounded-full bg-black px-6 text-sm font-semibold !text-white shadow-sm hover:opacity-90"
          >
            신청서 작성
          </Link>
        </div>

        <form
          action="/admin/booking"
          method="get"
          className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <input type="hidden" name="year" value={selectedYear} />
          <input type="hidden" name="month" value={selectedMonth} />

          <input
            type="text"
            name="keyword"
            defaultValue={keyword}
            placeholder="이름 검색"
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <input
            type="text"
            name="phone"
            defaultValue={phone}
            placeholder="연락처 검색"
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <input
            type="date"
            name="date"
            defaultValue={date}
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          />

          <select
            name="status"
            defaultValue={status}
            className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none"
          >
            <option value="">상태 전체</option>
            <option value="pending">대기</option>
            <option value="confirmed">확정</option>
            <option value="cancelled">취소</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="h-12 rounded-full bg-black px-5 text-sm font-medium text-white transition hover:opacity-90"
            >
              검색
            </button>

            <Link
              href={`/admin/booking?year=${selectedYear}&month=${selectedMonth}`}
              className="inline-flex h-12 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
            >
              초기화
            </Link>
          </div>
        </form>
      </div>

      <section className="mb-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">대기 중 예약</h2>
          <p className="text-sm text-black/45">{pendingRequests.length}건</p>
        </div>

        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
          <div className="divide-y divide-black/5">
            {pendingRequests.length ? (
              pendingRequests.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/booking/${item.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition hover:bg-black/[0.02] md:flex-row md:items-center md:justify-between"
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
              <div className="px-5 py-8 text-center text-sm text-black/45">
                대기 중 예약이 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              예약 스케줄 캘린더
            </h2>
            <p className="mt-1 text-sm text-black/45 md:block hidden">
              예약 신청과 기존 구글 캘린더 일정을 함께 확인할 수 있습니다.
            </p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Link
              href={buildMonthLink(
                prev.year,
                prev.month,
                keyword,
                phone,
                date,
                status,
                selectedDate
              )}
              className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
            >
              이전달
            </Link>

            <div className="min-w-[130px] text-center text-sm font-semibold text-black/70 md:min-w-[150px]">
              {calendar.year}년 {calendar.month}월
            </div>

            <Link
              href={buildMonthLink(
                next.year,
                next.month,
                keyword,
                phone,
                date,
                status,
                selectedDate
              )}
              className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
            >
              다음달
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center rounded-full bg-[#f2ede7] px-3 py-1 text-black/70">
            베이지 = 기존 일정
          </span>
          <span className="inline-flex items-center rounded-full bg-[#f7f5f2] px-3 py-1 text-black/70">
            회색 = 예약
          </span>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-black/10 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-black/10 bg-[#faf8f5]">
            {weekLabels.map((label, idx) => (
              <div
                key={label}
                className={`px-2 py-4 text-center text-sm font-semibold md:px-3 ${
                  idx === 0 ? "text-red-500" : idx === 6 ? "text-blue-600" : ""
                }`}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 auto-rows-[minmax(88px,_auto)] md:auto-rows-[minmax(220px,_auto)]">
            {calendar.cells.map((cell, index) => {
              const isToday = cell.dateString === todayString;
              const isSunday = index % 7 === 0;
              const isSaturday = index % 7 === 6;
              const externalItems = cell.dateString
                ? externalEventsMap.get(cell.dateString) ?? []
                : [];
              const isSelected = cell.dateString === selectedDate;

              return (
                <div
                  key={cell.key}
                  className={`border-b border-r border-black/10 ${
                    index % 7 === 6 ? "border-r-0" : ""
                  } ${!cell.day ? "bg-[#fcfbf9]" : "bg-white"}`}
                >
                  {cell.day ? (
                    <>
                      {/* 모바일용 */}
                      <Link
                        href={buildSelectedDateLink(
                          cell.dateString!,
                          selectedYear,
                          selectedMonth,
                          keyword,
                          phone,
                          date,
                          status
                        )}
                        className={`flex h-full min-h-[88px] flex-col justify-between p-2 md:hidden ${
                          isSelected ? "bg-black/[0.04]" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                              isToday
                                ? "bg-black text-white"
                                : isSunday
                                ? "text-red-500"
                                : isSaturday
                                ? "text-blue-600"
                                : "text-black"
                            }`}
                          >
                            {cell.day}
                          </span>

                          {(externalItems.length > 0 || cell.items.length > 0) && (
                            <span className="text-[10px] text-black/35">
                              {externalItems.length + cell.items.length}건
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {externalItems.length > 0 && (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f2ede7] px-1.5 text-[10px] text-[#8a5a2b]">
                              기{externalItems.length}
                            </span>
                          )}
                          {cell.items.length > 0 && (
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f7f5f2] px-1.5 text-[10px] text-black/70">
                              예{cell.items.length}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* 데스크톱용 */}
                      <div
                        className={`hidden min-h-[220px] p-3 md:block ${
                          isSelected ? "bg-black/[0.02]" : ""
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <Link
                            href={buildSelectedDateLink(
                              cell.dateString!,
                              selectedYear,
                              selectedMonth,
                              keyword,
                              phone,
                              date,
                              status
                            )}
                            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-sm font-semibold transition hover:bg-black/5 ${
                              isToday
                                ? "bg-black text-white"
                                : isSunday
                                ? "text-red-500"
                                : isSaturday
                                ? "text-blue-600"
                                : "text-black"
                            }`}
                          >
                            {cell.day}
                          </Link>
                        </div>

                        <div className="space-y-2">
                          {externalItems.map((item) => (
                            <Link
                              key={item.id}
                              href={`/admin/booking/calendar/${item.id}`}
                              className="block rounded-2xl border border-[#eadfce] bg-[#f6efe5] p-2.5 transition hover:bg-[#efe4d6]"
                            >
                              <div className="mb-1.5 flex flex-wrap items-center gap-1">
                                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#8a5a2b]">
                                  기존 일정
                                </span>
                                {formatCalendarEventTime(item.start_at) ? (
                                  <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-black/65">
                                    {formatCalendarEventTime(item.start_at)}
                                  </span>
                                ) : null}
                              </div>

                              <div className="truncate text-xs font-semibold text-black">
                                {item.title ?? "제목 없음"}
                              </div>
                              <div className="truncate text-[11px] text-black/50">
                                {item.location ?? "-"}
                              </div>
                            </Link>
                          ))}

                          {cell.items.slice(0, 4).map((item) => (
                            <Link
                              key={item.id}
                              href={`/admin/booking/${item.id}`}
                              className="block rounded-2xl border border-black/5 bg-[#f7f5f2] p-2.5 transition hover:bg-[#efebe5]"
                            >
                              <div className="mb-1.5 flex flex-wrap items-center gap-1">
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

                              <div className="truncate text-xs font-semibold text-black">
                                {item.name ?? "-"}
                              </div>
                              <div className="truncate text-[11px] text-black/50">
                                {item.location ?? "-"}
                              </div>
                            </Link>
                          ))}

                          {cell.items.length > 4 && (
                            <div className="px-1 text-xs text-black/45">
                              예약 + {cell.items.length - 4}건 더 있음
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="min-h-[88px] md:min-h-[220px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 모바일 날짜 선택 리스트 */}
        <div className="mt-5 rounded-[24px] border border-black/10 bg-white p-4 shadow-sm md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {selectedDate ? `${selectedDate} 일정` : "날짜를 선택하세요"}
            </h3>
            {selectedDate ? (
              <Link
                href={buildMonthLink(
                  selectedYear,
                  selectedMonth,
                  keyword,
                  phone,
                  date,
                  status
                )}
                className="text-xs text-black/45"
              >
                선택 해제
              </Link>
            ) : null}
          </div>

          {!selectedDate ? (
            <p className="text-sm text-black/45">
              캘린더에서 날짜를 누르면 아래에 해당 일정이 표시됩니다.
            </p>
          ) : selectedDateExternalItems.length === 0 &&
            selectedDateBookingItems.length === 0 ? (
            <p className="text-sm text-black/45">해당 날짜 일정이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateExternalItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/booking/calendar/${item.id}`}
                  className="block rounded-2xl border border-[#eadfce] bg-[#f6efe5] p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium text-[#8a5a2b]">
                      기존 일정
                    </span>
                    {formatCalendarEventTime(item.start_at) ? (
                      <span className="text-xs text-black/55">
                        {formatCalendarEventTime(item.start_at)}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm font-semibold text-black">
                    {item.title ?? "제목 없음"}
                  </div>
                  <div className="mt-1 text-xs text-black/50">
                    {item.location ?? "-"}
                  </div>
                </Link>
              ))}

              {selectedDateBookingItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/booking/${item.id}`}
                  className="block rounded-2xl border border-black/8 bg-[#f7f5f2] p-3"
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
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

                  <div className="text-sm font-semibold text-black">
                    {item.name ?? item.title ?? "-"}
                  </div>
                  <div className="mt-1 text-xs text-black/50">
                    {item.location ?? "-"}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <BookingListTable items={mergedListItems} />
    </main>
  );
}