import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import BookingListTable from "./BookingListTable";
import CalendarNavForm from "./CalendarNavForm";

export const dynamic = "force-dynamic";

const KST_TIMEZONE = "Asia/Seoul";

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
    status?: string;
    selectedDate?: string;
    searchYear?: string;
    searchMonth?: string;
    searchDay?: string;
  }>;
};

function pad2(value: number | string) {
  return String(value).padStart(2, "0");
}

function getKSTTodayParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value || "2026";
  const month = parts.find((p) => p.type === "month")?.value || "01";
  const day = parts.find((p) => p.type === "day")?.value || "01";

  return { year, month, day };
}

function getKSTDateStringFromISO(value?: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (!year || !month || !day) return null;
  return `${year}-${month}-${day}`;
}

function getKSTTimeStringFromISO(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getMonthCalendarData(
  requests: BookingRequest[],
  year: number,
  month: number
) {
  const safeDate = new Date(`${year}-${pad2(month)}-01T12:00:00+09:00`);
  const startWeekday = safeDate.getUTCDay();
  const totalDays = new Date(year, month, 0).getDate();

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
    const dateString = `${year}-${pad2(month)}-${pad2(day)}`;

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

function getExternalEventsMap(events: CalendarEvent[]) {
  const map = new Map<string, CalendarEvent[]>();

  for (const item of events) {
    const key = getKSTDateStringFromISO(item.start_at);
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
  if (month === 1) return { year: year - 1, month: 12 };
  return { year, month: month - 1 };
}

function getNextMonth(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function buildMonthLink(args: {
  year: number;
  month: number;
  keyword: string;
  phone: string;
  status: string;
  selectedDate?: string;
  searchYear?: string;
  searchMonth?: string;
  searchDay?: string;
}) {
  const params = new URLSearchParams();
  params.set("year", String(args.year));
  params.set("month", String(args.month));

  if (args.keyword) params.set("keyword", args.keyword);
  if (args.phone) params.set("phone", args.phone);
  if (args.status) params.set("status", args.status);
  if (args.selectedDate) params.set("selectedDate", args.selectedDate);
  if (args.searchYear) params.set("searchYear", args.searchYear);
  if (args.searchMonth) params.set("searchMonth", args.searchMonth);
  if (args.searchDay) params.set("searchDay", args.searchDay);

  return `/admin/booking?${params.toString()}`;
}

function buildSelectedDateLink(args: {
  targetDate: string;
  year: number;
  month: number;
  keyword: string;
  phone: string;
  status: string;
  searchYear?: string;
  searchMonth?: string;
  searchDay?: string;
}) {
  const params = new URLSearchParams();
  params.set("year", String(args.year));
  params.set("month", String(args.month));
  params.set("selectedDate", args.targetDate);

  if (args.keyword) params.set("keyword", args.keyword);
  if (args.phone) params.set("phone", args.phone);
  if (args.status) params.set("status", args.status);
  if (args.searchYear) params.set("searchYear", args.searchYear);
  if (args.searchMonth) params.set("searchMonth", args.searchMonth);
  if (args.searchDay) params.set("searchDay", args.searchDay);

  return `/admin/booking?${params.toString()}`;
}

export default async function AdminBookingPage({ searchParams }: PageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const todayParts = getKSTTodayParts();

  const keyword = resolvedSearchParams.keyword?.trim() || "";
  const phone = resolvedSearchParams.phone?.trim() || "";
  const status = resolvedSearchParams.status?.trim() || "";
  const selectedDate = resolvedSearchParams.selectedDate?.trim() || "";

  const searchYearInput = resolvedSearchParams.searchYear?.trim() || "";
  const searchMonthInput = resolvedSearchParams.searchMonth?.trim() || "";
  const searchDayInput = resolvedSearchParams.searchDay?.trim() || "";

  const hasExplicitDateFilter =
    Boolean(searchYearInput) &&
    Boolean(searchMonthInput) &&
    Boolean(searchDayInput);

  // 캘린더 년월은 year/month 파라미터 기준 (이전달/다음달 동작)
  const selectedYear = Number(resolvedSearchParams.year) || Number(todayParts.year);
  const selectedMonth = Number(resolvedSearchParams.month) || Number(todayParts.month);

  const exactFilterDate = hasExplicitDateFilter
    ? `${searchYearInput}-${pad2(searchMonthInput)}-${pad2(searchDayInput)}`
    : "";

  const { supabase } = await requireAdmin();

  const monthStart = new Date(`${selectedYear}-${pad2(selectedMonth)}-01T00:00:00+09:00`);
  const monthEnd =
    selectedMonth === 12
      ? new Date(`${selectedYear + 1}-01-01T00:00:00+09:00`)
      : new Date(`${selectedYear}-${pad2(selectedMonth + 1)}-01T00:00:00+09:00`);

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
    const matchDate = exactFilterDate ? item.date === exactFilterDate : true;
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
  const todayString = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

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
      const dateString = getKSTDateStringFromISO(item.start_at);
      const timeString = getKSTTimeStringFromISO(item.start_at);

      return {
        id: item.id,
        created_at: item.start_at ?? item.created_at ?? null,
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
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
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

        <form action="/admin/booking" method="get" className="mt-6 space-y-4">
          <input type="hidden" name="year" value={selectedYear} />
          <input type="hidden" name="month" value={selectedMonth} />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input
              type="text"
              name="keyword"
              defaultValue={keyword}
              placeholder="이름 검색"
              className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-black/5"
            />

            <input
              type="text"
              name="phone"
              defaultValue={phone}
              placeholder="연락처 검색"
              className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-black/5"
            />

            <select
              name="status"
              defaultValue={status}
              className="h-12 rounded-2xl border border-black/10 bg-[#f7f5f2] px-4 outline-none transition focus:bg-white focus:ring-2 focus:ring-black/5"
            >
              <option value="">상태 전체</option>
              <option value="pending">대기</option>
              <option value="confirmed">확정</option>
              <option value="cancelled">취소</option>
            </select>

            <div className="md:col-span-2 flex gap-2">
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
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                예약 스케줄 캘린더
              </h2>
              <p className="mt-1 hidden text-sm text-black/45 md:block">
                예약 신청과 기존 구글 캘린더 일정을 함께 확인할 수 있습니다.
              </p>
            </div>

            {/* 이전달 / 년월 / 다음달 + 날짜 검색 + Today */}
            <CalendarNavForm
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              keyword={keyword}
              phone={phone}
              status={status}
              selectedDate={selectedDate}
              searchYearInput={searchYearInput}
              searchMonthInput={searchMonthInput}
              searchDayInput={searchDayInput}
              prevYear={prev.year}
              prevMonth={prev.month}
              nextYear={next.year}
              nextMonth={next.month}
              calendarYear={calendar.year}
              calendarMonth={calendar.month}
              todayYear={Number(todayParts.year)}
              todayMonth={Number(todayParts.month)}
              todayDay={Number(todayParts.day)}
              todayString={todayString}
            />
          </div>

          {/* 날짜 검색 결과 리스트 - 캘린더 위에 표시 */}
          {hasExplicitDateFilter && exactFilterDate && (
            <div id="date-result" className="rounded-[24px] border border-black/8 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold">
                  {exactFilterDate} 일정
                </h3>
                <Link
                  href={buildMonthLink({
                    year: selectedYear,
                    month: selectedMonth,
                    keyword,
                    phone,
                    status,
                  })}
                  className="text-xs text-black/45 hover:text-black"
                >
                  검색 초기화
                </Link>
              </div>

              {(() => {
                const dateExternal = externalEventsMap.get(exactFilterDate) ?? [];
                const dateBooking = filteredRequests.filter((item) => item.date === exactFilterDate);

                if (dateExternal.length === 0 && dateBooking.length === 0) {
                  return (
                    <p className="text-sm text-black/45">해당 날짜 일정이 없습니다.</p>
                  );
                }

                return (
                  <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                    {dateExternal.map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin/booking/calendar/${item.id}`}
                        className="block rounded-2xl border border-[#eadfce] bg-[#f6efe5] p-3 transition hover:bg-[#efe4d6]"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-[#c7a77a]" />
                          {getKSTTimeStringFromISO(item.start_at) ? (
                            <span className="text-xs text-black/55">
                              {getKSTTimeStringFromISO(item.start_at)}
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

                    {dateBooking.map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin/booking/${item.id}`}
                        className="block rounded-2xl border border-black/8 bg-[#f7f5f2] p-3 transition hover:bg-[#efebe5]"
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTimeSlotBadgeClass(item.time)}`}>
                            {formatTimeSlot(item.time)}
                          </span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(item.status)}`}>
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
                );
              })()}
            </div>
          )}
        </div>

        {/* PC 선택 날짜 리스트 - 캘린더 위에 표시 */}
        {selectedDate && (
          <div id="date-result" className="mb-4 hidden rounded-[24px] border border-black/8 bg-white p-4 shadow-sm md:block">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">{selectedDate} 일정</h3>
              <Link
                href={buildMonthLink({
                  year: selectedYear,
                  month: selectedMonth,
                  keyword,
                  phone,
                  status,
                  searchYear: searchYearInput,
                  searchMonth: searchMonthInput,
                  searchDay: searchDayInput,
                })}
                className="text-xs text-black/45 hover:text-black"
              >
                선택 해제
              </Link>
            </div>

            {selectedDateExternalItems.length === 0 && selectedDateBookingItems.length === 0 ? (
              <p className="text-sm text-black/45">해당 날짜 일정이 없습니다.</p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {selectedDateExternalItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/booking/calendar/${item.id}`}
                    className="block rounded-2xl border border-[#eadfce] bg-[#f6efe5] p-3 transition hover:bg-[#efe4d6]"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-[#c7a77a]" />
                      {getKSTTimeStringFromISO(item.start_at) && (
                        <span className="text-xs text-black/55">
                          {getKSTTimeStringFromISO(item.start_at)}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-black">
                      {item.title ?? "제목 없음"}
                    </div>
                    <div className="mt-1 text-xs text-black/50">{item.location ?? "-"}</div>
                  </Link>
                ))}

                {selectedDateBookingItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/admin/booking/${item.id}`}
                    className="block rounded-2xl border border-black/8 bg-[#f7f5f2] p-3 transition hover:bg-[#efebe5]"
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getTimeSlotBadgeClass(item.time)}`}>
                        {formatTimeSlot(item.time)}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusBadgeClass(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-black">
                      {item.name ?? item.title ?? "-"}
                    </div>
                    <div className="mt-1 text-xs text-black/50">{item.location ?? "-"}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f2ede7] px-3 py-1 text-black/70">
            <span className="inline-block h-2 w-2 rounded-full bg-[#c7a77a]" />
            기존 일정
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f5f2] px-3 py-1 text-black/70">
            <span className="inline-block h-2 w-2 rounded-full bg-black/45" />
            예약
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

          <div className="grid grid-cols-7 auto-rows-[minmax(82px,_auto)] md:auto-rows-[minmax(145px,_auto)]">
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
                      {/* 모바일 */}
                      <Link
                        href={buildSelectedDateLink({
                          targetDate: cell.dateString!,
                          year: selectedYear,
                          month: selectedMonth,
                          keyword,
                          phone,
                          status,
                          searchYear: searchYearInput,
                          searchMonth: searchMonthInput,
                          searchDay: searchDayInput,
                        }) + "#selected-date"}
                        scroll={false}
                        className={`flex h-full min-h-[82px] flex-col justify-between p-2 md:hidden ${
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
                              {externalItems.length + cell.items.length}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {externalItems.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f2ede7] px-2 py-1 text-[10px] text-[#8a5a2b]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#c7a77a]" />
                              {externalItems.length}
                            </span>
                          )}
                          {cell.items.length > 0 && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#f7f5f2] px-2 py-1 text-[10px] text-black/65">
                              <span className="h-1.5 w-1.5 rounded-full bg-black/45" />
                              {cell.items.length}
                            </span>
                          )}
                        </div>
                      </Link>

                      {/* PC */}
                      <div
                        className={`hidden min-h-[145px] p-2.5 md:block ${
                          isSelected ? "bg-black/[0.02]" : ""
                        }`}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <Link
                            href={buildSelectedDateLink({
                              targetDate: cell.dateString!,
                              year: selectedYear,
                              month: selectedMonth,
                              keyword,
                              phone,
                              status,
                              searchYear: searchYearInput,
                              searchMonth: searchMonthInput,
                              searchDay: searchDayInput,
                            }) + "#date-result"}
                            scroll={false}
                            className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold transition hover:bg-black/5 ${
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

                        <div className="space-y-1.5">
                          {externalItems.slice(0, 3).map((item) => (
                            <Link
                              key={item.id}
                              href={`/admin/booking/calendar/${item.id}`}
                              className="block rounded-xl border border-[#eadfce] bg-[#f6efe5] px-2 py-1.5 transition hover:bg-[#efe4d6]"
                            >
                              <div className="mb-1 flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c7a77a]" />
                                {getKSTTimeStringFromISO(item.start_at) ? (
                                  <span className="text-[10px] text-black/55">
                                    {getKSTTimeStringFromISO(item.start_at)}
                                  </span>
                                ) : null}
                              </div>

                              <div className="truncate text-[10px] font-medium text-black/75">
                                {item.title ?? "제목 없음"}
                              </div>
                            </Link>
                          ))}

                          {cell.items.slice(0, 3).map((item) => (
                            <Link
                              key={item.id}
                              href={`/admin/booking/${item.id}`}
                              className="block rounded-xl border border-black/5 bg-[#f7f5f2] px-2 py-1.5 transition hover:bg-[#efebe5]"
                            >
                              <div className="mb-1 flex flex-wrap items-center gap-1">
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${getTimeSlotBadgeClass(
                                    item.time
                                  )}`}
                                >
                                  {formatTimeSlot(item.time)}
                                </span>
                              </div>

                              <div className="truncate text-[10px] font-medium text-black/75">
                                {item.name ?? "-"}
                              </div>
                            </Link>
                          ))}

                          {externalItems.length + cell.items.length > 6 && (
                            <div className="px-1 text-[10px] text-black/35">
                              + {externalItems.length + cell.items.length - 6}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="min-h-[82px] md:min-h-[145px]" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 모바일 선택 날짜 리스트 */}
        <div id="selected-date" className="mt-5 rounded-[24px] border border-black/10 bg-white p-4 shadow-sm md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">
              {selectedDate ? `${selectedDate} 일정` : "날짜를 선택하세요"}
            </h3>
            {selectedDate ? (
              <Link
                href={buildMonthLink({
                  year: selectedYear,
                  month: selectedMonth,
                  keyword,
                  phone,
                  status,
                  searchYear: searchYearInput,
                  searchMonth: searchMonthInput,
                  searchDay: searchDayInput,
                })}
                className="text-xs text-black/45"
              >
                선택 해제
              </Link>
            ) : null}
          </div>

          {!selectedDate ? (
            <p className="text-sm text-black/45">
              날짜를 누르면 아래에 해당 날짜 일정이 표시됩니다.
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
                    <span className="inline-flex h-2 w-2 rounded-full bg-[#c7a77a]" />
                    {getKSTTimeStringFromISO(item.start_at) ? (
                      <span className="text-xs text-black/55">
                        {getKSTTimeStringFromISO(item.start_at)}
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