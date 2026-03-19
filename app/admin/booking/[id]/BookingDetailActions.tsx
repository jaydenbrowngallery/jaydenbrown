"use client";

type BookingItem = {
  id: string;
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

function getTimeRange(slot?: string | null) {
  switch (slot) {
    case "1부":
      return { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 };
    case "2부":
      return { startHour: 14, startMinute: 30, endHour: 15, endMinute: 30 };
    case "3부":
      return { startHour: 16, startMinute: 0, endHour: 17, endMinute: 0 };
    default:
      return { startHour: 12, startMinute: 0, endHour: 13, endMinute: 0 };
  }
}

function toGoogleCalendarDate(date: Date) {
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function buildGoogleCalendarUrl(item: BookingItem) {
  if (!item.date) return "";

  const [year, month, day] = item.date.split("-").map(Number);
  if (!year || !month || !day) return "";

  const range = getTimeRange(item.time);

  const startLocal = new Date(
    year,
    month - 1,
    day,
    range.startHour,
    range.startMinute
  );
  const endLocal = new Date(
    year,
    month - 1,
    day,
    range.endHour,
    range.endMinute
  );

  const title = `${formatTimeSlot(item.time)} ${item.name || "-"} ${item.location || "-"}`;

  const details = [
    `이름: ${item.name || "-"}`,
    `연락처: ${item.phone || "-"}`,
    `이메일: ${item.email || "-"}`,
    `날짜: ${item.date || "-"}`,
    `시간: ${formatTimeSlot(item.time)}`,
    `장소: ${item.location || "-"}`,
    `주소: ${item.address || "-"}`,
    `상세주소: ${item.address_detail || "-"}`,
    `입금자명: ${item.depositor_name || "-"}`,
    `상품: ${item.product || "-"}`,
    `문의 내용: ${item.message || "-"}`,
  ].join("\n");

  const location = [item.location || "", item.address || "", item.address_detail || ""]
    .filter(Boolean)
    .join(" / ");

  const params = new URLSearchParams({
    text: title,
    dates: `${toGoogleCalendarDate(startLocal)}/${toGoogleCalendarDate(endLocal)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`;
}

function buildSmsBody() {
  return `안녕하세요^^ 제이든브라운 입니다.
신청서 접수 되었습니다.
다음 계좌번호로 예약금 5만원 입금해주시면 됩니다.
입금 후 따로 연락은 주지 않으셔도 됩니다.^^
계좌는 신한110-343-765507 예금주 박이용입니다. 감사합니다.`;
}

export default function BookingDetailActions({ item }: { item: BookingItem }) {
  const handleCalendarClick = async () => {
    const calendarUrl = buildGoogleCalendarUrl(item);

    if (!calendarUrl) {
      alert("날짜 정보가 없어 구글 캘린더를 열 수 없습니다.");
      return;
    }

    try {
      const res = await fetch("/api/booking/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: item.id }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        alert(result.message || "상태를 확정으로 변경하지 못했습니다.");
        return;
      }
    } catch (error) {
      alert("상태 변경 중 오류가 발생했습니다.");
      return;
    }

    window.open(calendarUrl, "_blank", "noopener,noreferrer");

    const phone = item.phone?.trim();
    if (!phone) {
      window.location.reload();
      return;
    }

    const smsBody = buildSmsBody();
    const cleanedPhone = phone.replace(/[^\d+]/g, "");
    const encodedBody = encodeURIComponent(smsBody);

    const smsUrl = `sms:${cleanedPhone}&body=${encodedBody}`;

    setTimeout(() => {
      window.location.href = smsUrl;

      setTimeout(() => {
        window.location.reload();
      }, 800);
    }, 500);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleCalendarClick}
        className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:opacity-90"
      >
        구글 캘린더 추가
      </button>
    </div>
  );
}