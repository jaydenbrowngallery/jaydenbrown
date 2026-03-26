import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import ActionButtons from "./ActionButtons";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type BookingRequest = {
  id: string;
  created_at?: string | null;
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
  content?: string | null;
  google_event_id?: string | null;
};

// calendar_events description 파싱 (HTML 테이블 + 텍스트 형식 모두 지원)
function parseCalendarDescription(description: string | null | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!description) return result;

  // 1. HTML 테이블 형식: <th>key</th><td>value</td>
  if (description.includes("<table") || description.includes("<th>")) {
    const thTdRegex = /<th[^>]*>(.*?)<\/th>\s*<td[^>]*>(.*?)<\/td>/gi;
    let match;
    while ((match = thTdRegex.exec(description)) !== null) {
      const key = match[1].replace(/<[^>]+>/g, "").trim();
      const value = match[2].replace(/<[^>]+>/g, "").trim();
      if (key) {
        result[key] = value;
      }
    }
    return result;
  }

  // 2. 텍스트 형식: "key: value" (줄바꿈 구분)
  const lines = description.split("\n");
  for (const line of lines) {
    // "키: 값" 또는 "키값" (공백 없이 붙어있는 경우도 처리)
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (key && value) {
        result[key] = value;
      }
    }
  }

  // 3. 구형 형식: "촬영자명이현서" (키와 값이 붙어있는 경우)
  if (Object.keys(result).length === 0) {
    const knownKeys = [
      "촬영자명", "연락처", "연락처A", "연락처B", "촬영일자", "촬영날짜",
      "행사시작시간", "시간", "행사장소", "촬영장소", "촬영종류",
      "상품선택", "예약금입금자명", "주소", "예약확인사항",
      "글쓴이", "이메일 주소", "제목", "스냅상품구성", "내용",
    ];
    for (const key of knownKeys) {
      const idx = description.indexOf(key);
      if (idx !== -1) {
        const afterKey = description.slice(idx + key.length);
        // 다음 키까지 또는 줄바꿈까지
        let endIdx = afterKey.length;
        for (const nextKey of knownKeys) {
          const nextIdx = afterKey.indexOf(nextKey);
          if (nextIdx > 0 && nextIdx < endIdx) {
            endIdx = nextIdx;
          }
        }
        const newlineIdx = afterKey.indexOf("\n");
        if (newlineIdx > 0 && newlineIdx < endIdx) {
          endIdx = newlineIdx;
        }
        const value = afterKey.slice(0, endIdx).trim();
        if (value) {
          result[key] = value;
        }
      }
    }
  }

  return result;
}

// title에서 정보 파싱: "[입금대기] 1200 배강민 도동산방" 또는 "1200 배강민 도동산방"
function parseTitleInfo(title: string | null | undefined) {
  if (!title) return { name: null, time: null, location: null };

  let clean = title.replace(/^\[.*?\]\s*/, "").trim();

  let time: string | null = null;
  const timeMatch = clean.match(/^(\d{3,4})\s+/);
  if (timeMatch) {
    const code = timeMatch[1];
    if (code === "1200") time = "1부(12시)";
    else if (code === "1430") time = "2부(14시30분)";
    else if (code === "1800") time = "3부(18시)";
    else time = code;
    clean = clean.replace(/^\d{3,4}\s+/, "");
  }

  const parts = clean.split(/\s+/);
  let name: string | null = null;
  let location: string | null = null;

  if (parts.length >= 2) {
    location = parts[parts.length - 1];
    name = parts.slice(0, -1).join(" ");
  } else if (parts.length === 1) {
    name = parts[0];
  }

  return { name, time, location };
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const period = hours >= 12 ? "오후" : "오전";
  const displayHours = hours % 12 || 12;
  return `${year}. ${month}. ${day}. ${period} ${displayHours}:${minutes}:${seconds}`;
}

function formatTimeSlot(slot?: string | null) {
  switch (slot) {
    case "1부": return "1부(12시)";
    case "2부": return "2부(14시30분)";
    case "3부": return "3부(16시)";
    default: return slot || "-";
  }
}

function formatStatus(status?: string | null) {
  switch (status) {
    case "confirmed": return "확정";
    case "deposit_pending": return "입금대기";
    case "cancelled": return "취소";
    case "calendar": return "캘린더";
    default: return "대기";
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-700";
    case "deposit_pending": return "bg-amber-100 text-amber-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "calendar": return "bg-blue-100 text-blue-700";
    default: return "bg-gray-100 text-gray-600";
  }
}

function Row({ label, value, multiline = false }: { label: string; value?: string | null; multiline?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[140px_1fr]">
      <div className="text-sm font-semibold text-black/55">{label}</div>
      <div className={`text-sm text-black ${multiline ? "whitespace-pre-wrap break-words" : ""}`}>
        {value || "-"}
      </div>
    </div>
  );
}

export default async function AdminBookingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  // 1. booking_requests에서 먼저 조회
  const { data: booking } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();

  // 2. booking_requests에 없으면 calendar_events에서 조회
  if (!booking) {
    const { data: calEvent, error: calError } = await supabase
      .from("calendar_events")
      .select("*")
      .eq("id", id)
      .single();

    if (calError || !calEvent) {
      return (
        <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
          <div className="rounded-[28px] bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-semibold">예약 상세</h1>
            <p className="mt-4 text-red-500">예약 정보를 불러오지 못했습니다.</p>
            <Link href="/admin/booking" className="mt-6 inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
              목록으로 돌아가기
            </Link>
          </div>
        </main>
      );
    }

    // description 파싱 (HTML 테이블 + 텍스트 + 구형 형식)
    const parsed = parseCalendarDescription(calEvent.description);
    const titleInfo = parseTitleInfo(calEvent.title);
    const startDate = calEvent.start_at ? new Date(calEvent.start_at) : null;
    const dateStr = startDate
      ? `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`
      : null;

    // description 파싱 결과 → title 파싱 결과 → 기본값 순으로 사용
    const displayName = parsed["글쓴이"] || parsed["촬영자명"] || titleInfo.name;
    const displayPhone = parsed["연락처"] || parsed["연락처A"];
    const displayEmail = parsed["이메일 주소"];
    const displayDate = parsed["촬영날짜"] || parsed["촬영일자"] || dateStr;
    const displayTime = parsed["시간"] || parsed["행사시작시간"] || titleInfo.time;
    const displayLocation = parsed["촬영장소"] || parsed["행사장소"] || titleInfo.location || calEvent.location;
    const displayAddress = parsed["주소"];
    const displayDepositor = parsed["예약금입금자명"];
    const displayProduct = parsed["스냅상품구성(웨딩, 돌잔치)"] || parsed["촬영종류"] || parsed["상품선택"];
    const displayMessage = parsed["내용"];
    const displayTitle = parsed["제목"] || calEvent.title;

    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass("calendar")}`}>
                캘린더
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {calEvent.title || "캘린더 일정"}
              </h1>
            </div>
            <Link href="/admin/booking" className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
              목록으로
            </Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-black/10">
            <div className="grid grid-cols-1 divide-y divide-black/10">
              <Row label="신청일" value={formatDateTime(calEvent.created_at)} />
              <Row label="제목" value={displayTitle} />
              <Row label="이름" value={displayName} />
              <Row label="연락처" value={displayPhone} />
              <Row label="이메일" value={displayEmail} />
              <Row label="촬영날짜" value={displayDate} />
              <Row label="시간" value={displayTime} />
              <Row label="장소" value={displayLocation} />
              <Row label="주소" value={displayAddress} />
              <Row label="예약금입금자명" value={displayDepositor} />
              <Row label="스냅상품구성(웨딩, 돌잔치)" value={displayProduct} />
              <Row label="내용" value={displayMessage} multiline />
            </div>
          </div>

          <ActionButtons
            email={displayEmail}
            phone={displayPhone}
            name={displayName}
            date={displayDate}
            time={displayTime}
            location={displayLocation}
            address={displayAddress}
            depositor_name={displayDepositor}
            product={displayProduct}
            message={displayMessage}
            title={calEvent.title}
            bookingId={null}
            status="calendar"
            googleEventId={calEvent.external_id}
          />
        </div>
      </main>
    );
  }

  // booking_requests 데이터가 있는 경우
  const item = booking as BookingRequest;
  const email = item.email || "-";
  const phone = item.phone || "-";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(item.status)}`}>
              {formatStatus(item.status)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {item.title || item.name || "예약 상세"}
            </h1>
          </div>
          <Link href="/admin/booking" className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
            목록으로
          </Link>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/10">
          <div className="grid grid-cols-1 divide-y divide-black/10">
            <Row label="신청일" value={formatDateTime(item.created_at)} />
            <Row label="제목" value={item.title} />
            <Row label="이름" value={item.name} />
            <Row label="연락처" value={item.phone} />
            <Row label="이메일" value={item.email} />
            <Row label="촬영날짜" value={item.date} />
            <Row label="시간" value={formatTimeSlot(item.time)} />
            <Row label="장소" value={item.location} />
            <Row label="주소" value={item.address} />
            <Row label="상세주소" value={item.address_detail} />
            <Row label="예약금입금자명" value={item.depositor_name} />
            <Row label="스냅상품구성(웨딩, 돌잔치)" value={item.product} />
            <Row label="내용" value={item.message || item.content} multiline />
          </div>
        </div>

        <ActionButtons
          email={email}
          phone={phone}
          name={item.name}
          date={item.date}
          time={item.time}
          location={item.location}
          address={item.address}
          address_detail={item.address_detail}
          depositor_name={item.depositor_name}
          product={item.product}
          message={item.message || item.content}
          title={item.title}
          bookingId={item.id}
          status={item.status}
          googleEventId={item.google_event_id}
        />
      </div>
    </main>
  );
}