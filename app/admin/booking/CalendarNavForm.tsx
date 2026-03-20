"use client";

import Link from "next/link";
import { useRef } from "react";

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

type Props = {
  selectedYear: number;
  selectedMonth: number;
  keyword: string;
  phone: string;
  status: string;
  selectedDate: string;
  searchYearInput: string;
  searchMonthInput: string;
  searchDayInput: string;
  prevYear: number;
  prevMonth: number;
  nextYear: number;
  nextMonth: number;
  calendarYear: number;
  calendarMonth: number;
  todayYear: number;
  todayMonth: number;
  todayDay: number;
  todayString: string;
};

export default function CalendarNavForm({
  selectedYear,
  selectedMonth,
  keyword,
  phone,
  status,
  selectedDate,
  searchYearInput,
  searchMonthInput,
  searchDayInput,
  prevYear,
  prevMonth,
  nextYear,
  nextMonth,
  calendarYear,
  calendarMonth,
  todayYear,
  todayMonth,
  todayDay,
  todayString,
}: Props) {
  const yearRef = useRef<HTMLInputElement>(null);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);
  const hiddenYearRef = useRef<HTMLInputElement>(null);
  const hiddenMonthRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleApply = () => {
    const sy = yearRef.current?.value || "";
    const sm = monthRef.current?.value || "";
    if (sy && hiddenYearRef.current) hiddenYearRef.current.value = sy;
    if (sm && hiddenMonthRef.current) hiddenMonthRef.current.value = sm;

    // 폼 action에 anchor 추가해서 결과 위치로 이동
    if (formRef.current) {
      formRef.current.action = "/admin/booking#date-result";
      formRef.current.submit();
    }
  };

  return (
    <form
      ref={formRef}
      action="/admin/booking"
      method="get"
      className="flex flex-wrap items-center gap-2"
    >
      <input ref={hiddenYearRef} type="hidden" name="year" defaultValue={selectedYear} />
      <input ref={hiddenMonthRef} type="hidden" name="month" defaultValue={selectedMonth} />
      <input type="hidden" name="keyword" value={keyword} />
      <input type="hidden" name="phone" value={phone} />
      <input type="hidden" name="status" value={status} />

      {/* 이전달 */}
      <Link
        href={buildMonthLink({
          year: prevYear,
          month: prevMonth,
          keyword,
          phone,
          status,
          selectedDate,
          searchYear: searchYearInput,
          searchMonth: searchMonthInput,
          searchDay: searchDayInput,
        })}
        className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
      >
        이전달
      </Link>

      <div className="min-w-[120px] text-center text-sm font-semibold text-black/70">
        {calendarYear}년 {calendarMonth}월
      </div>

      {/* 다음달 */}
      <Link
        href={buildMonthLink({
          year: nextYear,
          month: nextMonth,
          keyword,
          phone,
          status,
          selectedDate,
          searchYear: searchYearInput,
          searchMonth: searchMonthInput,
          searchDay: searchDayInput,
        })}
        className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
      >
        다음달
      </Link>

      <div className="mx-1 hidden h-6 w-px bg-black/10 md:block" />

      {/* 날짜 검색 */}
      <input
        ref={yearRef}
        type="number"
        name="searchYear"
        defaultValue={searchYearInput || String(todayYear)}
        min={2020}
        max={2100}
        placeholder="년도"
        className="h-10 w-20 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/5"
      />
      <input
        ref={monthRef}
        type="number"
        name="searchMonth"
        defaultValue={searchMonthInput || ""}
        min={1}
        max={12}
        placeholder="월"
        className="h-10 w-14 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/5"
      />
      <input
        ref={dayRef}
        type="number"
        name="searchDay"
        defaultValue={searchDayInput || ""}
        min={1}
        max={31}
        placeholder="일"
        className="h-10 w-14 rounded-2xl border border-black/10 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-black/5"
      />
      <button
        type="button"
        onClick={handleApply}
        className="h-10 rounded-full bg-black px-4 text-sm font-medium text-white transition hover:opacity-90"
      >
        적용
      </button>

      {/* Today */}
      <Link
        href={buildMonthLink({
          year: todayYear,
          month: todayMonth,
          keyword,
          phone,
          status,
          selectedDate: todayString,
          searchYear: String(todayYear),
          searchMonth: String(todayMonth),
          searchDay: String(todayDay),
        }) + "#date-result"}
        className="inline-flex h-10 items-center rounded-full border border-black/10 bg-white px-4 text-sm font-medium transition hover:bg-black/5"
      >
        Today
      </Link>
    </form>
  );
}
