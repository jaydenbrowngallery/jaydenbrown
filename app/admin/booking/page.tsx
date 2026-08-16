import Link from "next/link";
import { requireAdmin, supabaseAdmin } from "@/lib/supabase/admin";
import SchedulerPasscodeSetting from "./SchedulerPasscodeSetting";
import CalendarNavForm from "./CalendarNavForm";
import CopyFolderName from "./CopyFolderName";
import BookingClientSection from "./BookingClientSection";
import BookingListTable from "./BookingListTable";
import SearchBarSimple from "./SearchBarSimple";
import ScheduleSearchButton from "./ScheduleSearchButton";
import DepositReminderButton from "./DepositReminderButton";

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
  depositor_name?: string | null;
  email?: string | null;
  google_event_id?: string | null;
  guide_sent_at?: string | null;
  fee_sms_sent_at?: string | null;
  address_confirmed_at?: string | null;
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
  guide_sent_at?: string | null;
  fee_sms_sent_at?: string | null;
  address_confirmed_at?: string | null;
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
  depositor_name?: string | null;
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
      const order = { "1부": 1, "2부": 2, "2부식후": 3, "3부": 4 } as Record<string, number>;
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
    case "2부식후": return "2부식후";
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
    case "2부식후": return "2부식후";
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
    case "deposit_pending":
      return "입금대기";
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
    case "deposit_pending":
      return "입금대기";
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

// supabase .or() 필터에서 특수문자 escape
function escapeForSupabaseOr(value: string) {
  return value.replace(/[,()'"\\]/g, "");
}


/* 후반작업 폴더명 규칙 — "2026년 8월 15일 박시후 도동산방" (월·일에 0 붙이지 않음) */
function folderName(dateString: string | undefined, name: string | null | undefined, location: string | null | undefined) {
  if (!dateString) return "";
  const [y, m, d] = dateString.split("-").map((v) => Number(v));
  if (!y || !m || !d) return "";
  const nm = (name || "").trim();
  const loc = (location || "").trim();
  return [`${y}년 ${m}월 ${d}일`, nm, loc && loc !== "-" ? loc : "도동산방"]
    .filter(Boolean)
    .join(" ");
}

/* 캘린더 일정 제목에서 촬영자명만 뽑는다 — "[확정] 1200 김지한 도동산방" → "김지한" */
function nameFromCalendarTitle(title: string | null | undefined) {
  let t = (title || "").replace(/\[[^\]]*\]/g, " ").replace(/☀|여름/g, " ");
  t = t.replace(/\b\d{3,4}\b/g, " ");
  const STOP = new Set(["도동산방", "농도", "촬영", "식후", "스냅", "부"]);
  const toks = (t.match(/[가-힣]+/g) || []).filter((x) => !STOP.has(x) && x.length >= 2);
  return toks[0] || "";
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

  // 검색 모드 여부 — keyword가 있으면 검색 결과 전용 화면
  const isSearchMode = Boolean(keyword);

  const selectedYear = Number(resolvedSearchParams.year) || Number(todayParts.year);
  const selectedMonth = Number(resolvedSearchParams.month) || Number(todayParts.month);

  const exactFilterDate = hasExplicitDateFilter
    ? `${searchYearInput}-${pad2(searchMonthInput)}-${pad2(searchDayInput)}`
    : "";

  const { supabase } = await requireAdmin();

  // /today 스케줄러 이동 비밀번호 (미설정 시 기본 0814)
  const { data: pcRow } = await supabaseAdmin
    .from("site_settings")
    .select("value")
    .eq("id", "scheduler_passcode")
    .maybeSingle();
  const schedulerPasscode = ((pcRow?.value as string) || "").trim() || "0814";

  const monthStart = new Date(`${selectedYear}-${pad2(selectedMonth)}-01T00:00:00+09:00`);
  const monthEnd =
    selectedMonth === 12
      ? new Date(`${selectedYear + 1}-01-01T00:00:00+09:00`)
      : new Date(`${selectedYear}-${pad2(selectedMonth + 1)}-01T00:00:00+09:00`);

  const safeKeyword = keyword ? escapeForSupabaseOr(keyword) : "";
  const ilikeValue = safeKeyword ? `%${safeKeyword}%` : "";

  // 목록/달력 렌더에 실제로 쓰는 컬럼만 선택한다.
  // (select("*")는 message·address·product·raw_data 등 무거운 컬럼까지 최대 5000행 끌어와 느림)
  const BOOKING_LIST_COLS =
    "id, created_at, title, name, phone, date, time, location, status, depositor_name, email, google_event_id, guide_sent_at, fee_sms_sent_at, address_confirmed_at";
  const CALENDAR_LIST_COLS =
    "id, created_at, external_id, title, description, location, start_at, end_at, source, guide_sent_at, fee_sms_sent_at, address_confirmed_at";

  // 모든 조회를 한 번의 Promise.all로 묶어 DB 왕복(직렬 대기)을 줄인다.
  const [
    { data: requests, error },
    { data: calendarEvents },
    { data: allCalendarEvents },
    { data: cancelledBookings },
    { data: cancelledCalEvents },
  ] = await Promise.all([
    supabase
      .from("booking_requests")
      .select(BOOKING_LIST_COLS)
      .is("cancelled_at", null)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase
      .from("calendar_events")
      .select(CALENDAR_LIST_COLS)
      .is("cancelled_at", null)
      .gte("start_at", monthStart.toISOString())
      .lt("start_at", monthEnd.toISOString())
      .order("start_at", { ascending: true })
      .limit(5000),
    safeKeyword
      ? supabase
          .from("calendar_events")
          .select(CALENDAR_LIST_COLS)
          .is("cancelled_at", null)
          .or(
            `title.ilike.${ilikeValue},description.ilike.${ilikeValue},location.ilike.${ilikeValue}`
          )
          .order("start_at", { ascending: false })
          .limit(5000)
      : Promise.resolve({ data: null }),
    // 취소건(소프트 취소된 부킹/캘린더) — 페이지 하단의 "취소건 확인" 섹션용
    supabase
      .from("booking_requests")
      .select("id, name, title, phone, date, time, cancelled_at, status, google_event_id")
      .not("cancelled_at", "is", null)
      .order("cancelled_at", { ascending: false })
      .limit(200),
    supabase
      .from("calendar_events")
      .select("id, title, start_at, cancelled_at, external_id")
      .not("cancelled_at", "is", null)
      .order("cancelled_at", { ascending: false })
      .limit(200),
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

  // 취소건 통합 리스트 (booking + calendar). 같은 구글 이벤트로 양쪽에 중복된 건은 booking 쪽을 우선.
  const cancelledBookingGoogleIds = new Set<string>(
    ((cancelledBookings ?? []) as any[])
      .map((b) => b.google_event_id)
      .filter(Boolean) as string[]
  );
  const cancelledItems: Array<{
    key: string;
    source: "booking" | "calendar";
    id: string;
    name: string;
    phone: string | null;
    date: string | null;
    cancelledAt: string;
    detailHref: string;
  }> = [
    ...((cancelledBookings ?? []) as any[]).map((b) => ({
      key: `b-${b.id}`,
      source: "booking" as const,
      id: b.id as string,
      name: (b.name || b.title || "예약") as string,
      phone: (b.phone as string) || null,
      date: (b.date as string) || null,
      cancelledAt: b.cancelled_at as string,
      detailHref: `/admin/booking/${b.id}`,
    })),
    ...((cancelledCalEvents ?? []) as any[])
      .filter((c) => !c.external_id || !cancelledBookingGoogleIds.has(String(c.external_id)))
      .map((c) => ({
        key: `c-${c.id}`,
        source: "calendar" as const,
        id: c.id as string,
        name: String(c.title || "캘린더")
          .replace(/^\[[^\]]*\]\s*/, "")
          .replace(/^\d{3,4}\s+/, "")
          .trim() || "캘린더",
        phone: null,
        date: getKSTDateStringFromISO(c.start_at),
        cancelledAt: c.cancelled_at as string,
        detailHref: `/admin/booking/calendar/${c.id}`,
      })),
  ].sort((a, b) => (a.cancelledAt < b.cancelledAt ? 1 : -1));

  const allRequests = (requests ?? []) as BookingRequest[];
  const importedCalendarEvents = (calendarEvents ?? []) as CalendarEvent[];

  const filteredRequests = allRequests.filter((item) => {
    const matchKeyword = keyword
      ? (item.name || "").toLowerCase().includes(keyword.toLowerCase()) || (item.phone || "").includes(keyword) || (item.email || "").toLowerCase().includes(keyword.toLowerCase()) || (item.depositor_name || "").toLowerCase().includes(keyword.toLowerCase())
      : true;

    const matchPhone = phone ? (item.phone || "").includes(phone) : true;
    const matchStatus = status ? (item.status || "pending") === status : true;

    // 날짜(exactFilterDate)로는 여기서 전역 필터링하지 않는다.
    // 월 달력 그리드/대기 리스트는 항상 해당 월 전체를 보여줘야 하고,
    // 날짜 검색 결과는 아래 "date-result" 박스에서 별도로 exactFilterDate로 재필터링한다.
    return matchKeyword && matchPhone && matchStatus;
  });

  // booking_requests의 google_event_id 모음 — calendar_events 중복 표시 방지에 사용
  const bookingGoogleEventIds = new Set<string>(
    allRequests.map((r) => r.google_event_id).filter(Boolean) as string[]
  );

  // 검색 모드든 일반 모드든, booking_requests와 같은 Google 이벤트는 중복 제거
  const filteredCalendarEvents = keyword
    ? ((allCalendarEvents ?? []) as CalendarEvent[]).filter(
        (ev) =>
          !ev.external_id || !bookingGoogleEventIds.has(String(ev.external_id))
      )
    : importedCalendarEvents.filter(
        (ev) =>
          !ev.external_id || !bookingGoogleEventIds.has(String(ev.external_id))
      );

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
    depositor_name: item.depositor_name,
    source: "booking",
    detailHref: `/admin/booking/${item.id}`,
  }));

  const calendarListItems: BookingListItem[] = filteredCalendarEvents.map(
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

  // ───────────────────────────────────────────────────────────────
  // 🔍 검색 모드: 캘린더와 다른 섹션 모두 숨기고 검색 결과 + 검색창만 표시
  // ───────────────────────────────────────────────────────────────
  if (isSearchMode) {
    const totalCount = mergedListItems.length;

    return (
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {/* 상단: 검색창 + 캘린더로 돌아가기 버튼 */}
        <section className="mb-6">
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">Search Results</p>
                <h1 className="mt-1 text-xl font-semibold">
                  &quot;{keyword}&quot; 검색 결과 ({totalCount}건)
                </h1>
              </div>
              <Link
                href="/admin/booking"
                className="inline-flex h-11 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
              >
                ← 부킹 메인으로
              </Link>
            </div>

            <SearchBarSimple defaultKeyword={keyword} />
          </div>
        </section>

        {/* 검색 결과 리스트 */}
        <BookingListTable items={mergedListItems} />

        {/* 하단: 검색창 한 번 더 + 부킹 메인 버튼 (스크롤 안 올리고 다시 검색) */}
        <section className="mt-8">
          <div className="rounded-[28px] border border-black/10 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-black/60">다시 검색하기</p>
              <Link
                href="/admin/booking"
                className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-xs font-medium text-black transition hover:bg-black/5"
              >
                ← 부킹 메인으로
              </Link>
            </div>
            <SearchBarSimple defaultKeyword={keyword} />
          </div>
        </section>
      </main>
    );
  }

  // ───────────────────────────────────────────────────────────────
  // 📅 일반 모드: 기존 캘린더 + 리스트 화면
  // ───────────────────────────────────────────────────────────────

  const depositPendingRequests = filteredRequests.filter(
    (item) => item.status === "deposit_pending"
  );
  const pendingRequests = filteredRequests.filter(
    (item) => (item.status || "pending") === "pending"
  );

  const calendar = getMonthCalendarData(
    filteredRequests,
    selectedYear,
    selectedMonth
  );

  // booking_requests와 같은 Google 이벤트인 calendar_events는 중복이므로 표시에서 제외
  const dedupedCalendarEvents = importedCalendarEvents.filter(
    (ev) => !ev.external_id || !bookingGoogleEventIds.has(String(ev.external_id))
  );
  const externalEventsMap = getExternalEventsMap(dedupedCalendarEvents);

  const weekLabels = ["일", "월", "화", "수", "목", "금", "토"];
  const prev = getPrevMonth(selectedYear, selectedMonth);
  const next = getNextMonth(selectedYear, selectedMonth);
  const todayString = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

  const selectedDateBookingItems = selectedDate
    ? filteredRequests.filter((item) => item.date === selectedDate)
    : [];

  const selectedDateExternalItems = selectedDate
    ? externalEventsMap.get(selectedDate) ?? []
    : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">

      <SchedulerPasscodeSetting initial={schedulerPasscode} />

      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Link
          href="/admin/orders"
          className="inline-flex h-10 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-4 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
        >
          📦 주문관리
        </Link>
        <Link
          href="/admin/booking/orders-completed"
          className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 px-4 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
        >
          📦 주문완료 내역
        </Link>
        <ScheduleSearchButton />
      </div>

      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
          <div className="divide-y divide-black/5">
            {pendingRequests.length ? (
              pendingRequests.map((item) => (
                <Link
                  key={item.id}
                  href={`/admin/booking/${item.id}`}
                  className="flex flex-col gap-2 px-5 py-4 transition hover:bg-black/[0.02]"
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
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-black/55">
                    <span>{item.phone ?? "-"}</span>
                    <span>{item.location ?? "-"}</span>
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

        <div className="overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-sm">
          <div className="divide-y divide-black/5">
            {depositPendingRequests.length ? (
              depositPendingRequests.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <Link
                    href={`/admin/booking/${item.id}`}
                    className="flex min-w-0 flex-1 flex-col gap-2 transition hover:opacity-70"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">
                        입금대기
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs ${getTimeSlotBadgeClass(item.time)}`}>
                        {item.date ?? "-"} / {formatTimeSlot(item.time)}
                      </span>
                      <span className="font-medium">{item.name ?? "-"}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-black/55">
                      <span>{item.phone ?? "-"}</span>
                      <span>{item.location ?? "-"}</span>
                    </div>
                  </Link>
                  <div className="flex shrink-0 justify-end self-end md:self-auto">
                    <DepositReminderButton phone={item.phone} />
                  </div>
                </div>
              ))
            ) : (
              <div className="px-5 py-8 text-center text-sm text-black/45">
                입금 대기 중인 예약이 없습니다.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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
                          {externalItems.map((item) => (
                            <div key={item.id} className="relative">
                            <CopyFolderName
                              text={folderName(
                                cell.dateString,
                                nameFromCalendarTitle(item.title),
                                item.location
                              )}
                            />
                            <Link
                              href={`/admin/booking/calendar/${item.id}`}
                              className="block rounded-xl border border-[#eadfce] bg-[#f6efe5] px-2 py-1.5 pr-6 transition hover:bg-[#efe4d6]"
                            >
                              <div className="mb-1 flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#c7a77a]" />
                                {getKSTTimeStringFromISO(item.start_at) ? (
                                  <span className="text-[10px] text-black/55">
                                    {getKSTTimeStringFromISO(item.start_at)}
                                  </span>
                                ) : null}
                                {item.guide_sent_at && (
                                  <span className="text-[10px] leading-none" title="안내문자 발송됨">💬</span>
                                )}
                                {item.fee_sms_sent_at && (
                                  <span className="text-[10px] leading-none" title="촬영비 입금 문자 발송됨">💰</span>
                                )}
                                {item.address_confirmed_at && (
                                  <span className="text-[10px] leading-none" title="고객 주소 확인됨">📍</span>
                                )}
                              </div>

                              <div className="truncate text-[10px] font-medium text-black/75">
                                {item.title ?? "제목 없음"}
                              </div>
                            </Link>
                            </div>
                          ))}

                          {cell.items.map((item) => (
                            <div key={item.id} className="relative">
                            <CopyFolderName
                              text={folderName(cell.dateString, item.name, item.location)}
                            />
                            <Link
                              href={`/admin/booking/${item.id}`}
                              className="block rounded-xl border border-black/5 bg-[#f7f5f2] px-2 py-1.5 pr-6 transition hover:bg-[#efebe5]"
                            >
                              <div className="mb-1 flex flex-wrap items-center gap-1">
                                <span
                                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${getTimeSlotBadgeClass(
                                    item.time
                                  )}`}
                                >
                                  {formatTimeSlot(item.time)}
                                </span>
                                {typeof item.title === "string" && item.title.includes("☀여름") && (
                                  <span className="text-[10px] leading-none" title="여름 이벤트">☀</span>
                                )}
                                {item.guide_sent_at && (
                                  <span className="text-[10px] leading-none" title="안내문자 발송됨">💬</span>
                                )}
                                {item.fee_sms_sent_at && (
                                  <span className="text-[10px] leading-none" title="촬영비 입금 문자 발송됨">💰</span>
                                )}
                                {item.address_confirmed_at && (
                                  <span className="text-[10px] leading-none" title="고객 주소 확인됨">📍</span>
                                )}
                              </div>

                              <div className="truncate text-[10px] font-medium text-black/75">
                                {item.name ?? "-"}
                              </div>
                            </Link>
                            </div>
                          ))}

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

        {selectedDate && (
        <div id="selected-date" className="mt-5 rounded-[24px] border border-black/10 bg-white p-4 shadow-sm md:hidden">
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
              className="text-xs text-black/45"
            >
              선택 해제
            </Link>
          </div>

          {selectedDateExternalItems.length === 0 && selectedDateBookingItems.length === 0 ? (
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
        )}
      </section>

      <BookingClientSection items={mergedListItems} />

      <div className="mt-6 flex justify-center">
        <Link
          href="/booking-private-jb2026"
          className="inline-flex h-12 items-center justify-center rounded-full bg-black px-8 text-sm font-semibold !text-white shadow-sm hover:opacity-90"
        >
          신청서 작성
        </Link>
      </div>

      {/* 취소건 확인 — 항상 표시(0건이어도 버튼 노출), 접기/펴기 */}
      <section className="mt-10">
        <details className="overflow-hidden rounded-2xl border border-black/10 bg-[#fafafa]">
          <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-black/65 hover:bg-black/5">
            🚫 취소건 확인 ({cancelledItems.length}건)
          </summary>
          <div className="divide-y divide-black/5 border-t border-black/10">
            {cancelledItems.length === 0 && (
              <div className="px-5 py-6 text-center text-sm text-black/45">
                취소된 예약이 없습니다.
              </div>
            )}
            {cancelledItems.map((it) => {
                const cancelledKST = new Intl.DateTimeFormat("ko-KR", {
                  timeZone: "Asia/Seoul",
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                }).format(new Date(it.cancelledAt));
                return (
                  <Link
                    key={it.key}
                    href={it.detailHref}
                    className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm text-black/65 transition hover:bg-black/5"
                  >
                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-medium text-red-700">
                      취소
                    </span>
                    <span className="text-black/55">{it.date || "-"}</span>
                    <span className="font-medium text-black/80 line-through decoration-black/30">
                      {it.name}
                    </span>
                    {it.phone && <span className="text-black/55">{it.phone}</span>}
                    <span className="ml-auto text-xs text-black/40">취소: {cancelledKST}</span>
                  </Link>
                );
              })}
          </div>
        </details>
      </section>
    </main>
  );
}
