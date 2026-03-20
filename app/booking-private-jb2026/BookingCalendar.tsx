"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type BookingItem = {
  id: string;
  title?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  address?: string | null;
  address_detail?: string | null;
  depositor_name?: string | null;
  product?: string | null;
  message?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type Props = {
  bookings: BookingItem[];
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function makeLocalDate(year: number, month: number, day: number) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKeyToLocal(dateKey: string) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return makeLocalDate(y, m, d);
}

function getBookingDateKey(item: BookingItem) {
  if (item.date && item.date.length >= 10) {
    const raw = item.date.slice(0, 10);
    const [y, m, d] = raw.split("-").map(Number);
    if (y && m && d) {
      return toDateKey(makeLocalDate(y, m, d));
    }
  }
  return null;
}

function getTodayLocal() {
  const now = new Date();
  return makeLocalDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function classNames(...arr: Array<string | false | null | undefined>) {
  return arr.filter(Boolean).join(" ");
}

function formatSlotText(slot?: string | null) {
  switch (slot) {
    case "1부":
      return "1부";
    case "2부":
      return "2부";
    case "3부":
      return "3부";
    default:
      return slot || "예약";
  }
}

function formatSlotFull(slot?: string | null) {
  switch (slot) {
    case "1부":
      return "1부(12시)";
    case "2부":
      return "2부(14시30분)";
    case "3부":
      return "3부(18시)";
    default:
      return slot || "-";
  }
}

export default function BookingCalendar({ bookings }: Props) {
  const today = getTodayLocal();
  const todayKey = toDateKey(today);

  const detailSectionRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);

  const [currentMonth, setCurrentMonth] = useState(
    makeLocalDate(today.getFullYear(), today.getMonth() + 1, 1)
  );
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  const [searchYear, setSearchYear] = useState("2026");
  const [searchMonth, setSearchMonth] = useState(String(today.getMonth() + 1));
  const [searchDay, setSearchDay] = useState(String(today.getDate()));

  const bookingsByDate = useMemo(() => {
    const map: Record<string, BookingItem[]> = {};

    for (const item of bookings) {
      const key = getBookingDateKey(item);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(item);
    }

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const aa = (a.time || a.title || "").toString();
        const bb = (b.time || b.title || "").toString();
        return aa.localeCompare(bb, "ko");
      });
    });

    return map;
  }, [bookings]);

  const selectedItems = bookingsByDate[selectedDateKey] || [];

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const firstDayOfMonth = makeLocalDate(year, month, 1);
  const startWeekday = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month, 0).getDate();

  const scrollToDetailList = () => {
    const el = detailSectionRef.current;
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 16;
    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  };

  const selectDateAndShowList = (dateKey: string) => {
    setSelectedDateKey(dateKey);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToDetailList();
      });
    });
  };

  const prevMonth = () => {
    setCurrentMonth(makeLocalDate(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(makeLocalDate(year, month + 1, 1));
  };

  const goToday = () => {
    const t = getTodayLocal();
    const key = toDateKey(t);

    setCurrentMonth(makeLocalDate(t.getFullYear(), t.getMonth() + 1, 1));
    setSelectedDateKey(key);
    setSearchYear("2026");
    setSearchMonth(String(t.getMonth() + 1));
    setSearchDay(String(t.getDate()));

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToDetailList();
      });
    });
  };

  const goToSearchDate = () => {
    const y = Number(searchYear);
    const m = Number(searchMonth);
    const d = Number(searchDay);

    if (!y || !m || !d) {
      alert("연도, 월, 일을 모두 입력해 주세요.");
      return;
    }

    if (m < 1 || m > 12) {
      alert("월은 1~12 사이로 입력해 주세요.");
      return;
    }

    if (d < 1 || d > 31) {
      alert("일은 1~31 사이로 입력해 주세요.");
      return;
    }

    const target = makeLocalDate(y, m, d);

    if (
      target.getFullYear() !== y ||
      target.getMonth() + 1 !== m ||
      target.getDate() !== d
    ) {
      alert("올바른 날짜를 입력해 주세요.");
      return;
    }

    const key = toDateKey(target);
    setCurrentMonth(makeLocalDate(y, m, 1));
    setSelectedDateKey(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToDetailList();
      });
    });
  };

  useEffect(() => {
    const t = getTodayLocal();
    setSearchYear("2026");
    setSearchMonth(String(t.getMonth() + 1));
    setSearchDay(String(t.getDate()));
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
  }, [selectedDateKey]);

  const cells: Array<{
    date: Date;
    dateKey: string;
    inCurrentMonth: boolean;
  }> = [];

  for (let i = 0; i < startWeekday; i++) {
    const d = makeLocalDate(year, month, 1 - (startWeekday - i));
    cells.push({
      date: d,
      dateKey: toDateKey(d),
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = makeLocalDate(year, month, day);
    cells.push({
      date: d,
      dateKey: toDateKey(d),
      inCurrentMonth: true,
    });
  }

  while (cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = makeLocalDate(
      last.getFullYear(),
      last.getMonth() + 1,
      last.getDate() + 1
    );
    cells.push({
      date: d,
      dateKey: toDateKey(d),
      inCurrentMonth: false,
    });
  }

  return (
    <section className="w-full space-y-5">
      <div
        ref={detailSectionRef}
        className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_16px_50px_rgba(0,0,0,0.05)]"
      >
        <div className="border-b border-black/5 px-4 py-4 sm:px-6">
          <div className="text-xs tracking-[0.22em] text-black/35">SELECTED DATE</div>
          <div className="mt-1 text-lg font-semibold text-black">
            {selectedDateKey} ({WEEKDAYS[parseDateKeyToLocal(selectedDateKey).getDay()]})
          </div>
        </div>

        <div className="px-4 py-4 sm:px-6">
          {selectedItems.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-black/10 bg-[#faf8f5] px-4 py-8 text-center text-sm text-black/45">
              이 날짜에는 예약이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[22px] border border-black/8 bg-[#faf8f5] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-semibold text-black">
                        {item.title || "예약"}
                      </div>
                      <div className="mt-1 text-sm text-black/70">
                        {formatSlotFull(item.time)}
                      </div>
                      <div className="mt-1 text-sm text-black/60">
                        {item.name || "이름 없음"}
                      </div>
                      {item.phone && (
                        <div className="mt-1 text-sm text-black/35">{item.phone}</div>
                      )}
                      {item.location && (
                        <div className="mt-1 text-sm text-black/45">{item.location}</div>
                      )}
                    </div>

                    {item.status && (
                      <div className="inline-flex w-fit items-center rounded-full border border-black/8 bg-white px-3 py-1 text-xs font-medium text-black/55">
                        {item.status}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.06)]">
        <div className="border-b border-black/5 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(248,248,248,1))] px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prevMonth}
                className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                이전달
              </button>

              <div className="min-w-[120px] text-center text-xl font-semibold tracking-tight text-black sm:min-w-[140px]">
                {year}년 {month}월
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black shadow-sm transition hover:-translate-y-[1px] hover:shadow-md"
              >
                다음달
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                value={searchYear}
                onChange={(e) => setSearchYear(e.target.value)}
                className="h-11 w-[110px] rounded-2xl border border-black/10 bg-[#faf8f5] px-4 text-sm text-black outline-none transition placeholder:text-black/25 focus:border-black/25"
                placeholder="연도"
              />
              <input
                type="number"
                value={searchMonth}
                onChange={(e) => setSearchMonth(e.target.value)}
                className="h-11 w-[84px] rounded-2xl border border-black/10 bg-[#faf8f5] px-4 text-sm text-black outline-none transition placeholder:text-black/25 focus:border-black/25"
                placeholder="월"
              />
              <input
                type="number"
                value={searchDay}
                onChange={(e) => setSearchDay(e.target.value)}
                className="h-11 w-[84px] rounded-2xl border border-black/10 bg-[#faf8f5] px-4 text-sm text-black outline-none transition placeholder:text-black/25 focus:border-black/25"
                placeholder="일"
              />

              <button
                type="button"
                onClick={goToSearchDate}
                className="inline-flex h-11 items-center rounded-full bg-black px-5 text-sm font-medium text-white transition hover:opacity-90"
              >
                날짜 적용
              </button>

              <button
                type="button"
                onClick={goToday}
                className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:opacity-90"
              >
                Today
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-black/5 bg-[#fbfbfb] px-2 py-2 sm:px-4">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={classNames(
                "py-2 text-center text-xs font-medium sm:text-sm",
                idx === 0 && "text-rose-500",
                idx === 6 && "text-sky-500",
                idx !== 0 && idx !== 6 && "text-black/45"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-px bg-black/5 p-px">
          {cells.map(({ date, dateKey, inCurrentMonth }) => {
            const day = date.getDate();
            const weekday = date.getDay();
            const isToday = dateKey === todayKey;
            const isSelected = dateKey === selectedDateKey;
            const dayBookings = bookingsByDate[dateKey] || [];
            const hasBookings = dayBookings.length > 0;

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => selectDateAndShowList(dateKey)}
                className={classNames(
                  "group relative min-h-[82px] bg-white p-2 text-left transition sm:min-h-[112px] sm:p-2.5",
                  "hover:z-10 hover:bg-[#fcfcfc]",
                  !inCurrentMonth && "bg-[#f8f8f8]",
                  isSelected && "ring-2 ring-black ring-inset"
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={classNames(
                      "inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold",
                      "sm:h-7 sm:w-7 sm:text-xs",
                      !inCurrentMonth && "text-black/20",
                      inCurrentMonth && weekday === 0 && "text-rose-500",
                      inCurrentMonth && weekday === 6 && "text-sky-500",
                      inCurrentMonth && weekday !== 0 && weekday !== 6 && "text-black/80",
                      isToday && "bg-black text-white"
                    )}
                  >
                    {day}
                  </div>

                  {hasBookings && (
                    <div className="hidden sm:flex items-center gap-1">
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-black/25" />
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-black/15" />
                    </div>
                  )}
                </div>

                <div className="mt-3 flex min-h-[18px] items-center gap-1 sm:hidden">
                  {hasBookings &&
                    dayBookings.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="inline-flex h-1.5 w-1.5 rounded-full bg-black"
                      />
                    ))}
                  {dayBookings.length > 3 && (
                    <span className="ml-1 text-[10px] font-medium text-black/35">
                      +{dayBookings.length - 3}
                    </span>
                  )}
                </div>

                <div className="mt-2 hidden space-y-1 sm:block">
                  {dayBookings.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="truncate rounded-lg bg-[#f4f2ef] px-2 py-1 text-[10px] font-medium text-black/60"
                    >
                      {formatSlotText(item.time)}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <div className="px-1 text-[10px] font-medium text-black/30">
                      +{dayBookings.length - 2} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}