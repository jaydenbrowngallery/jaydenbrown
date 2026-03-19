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

async function copyTextWithFallback(text: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (error) {
    console.error("Clipboard API 복사 실패:", error);
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);

    return copied;
  } catch (error) {
    console.error("fallback 복사 실패:", error);
    return false;
  }
}

function openSmsApp(phone: string, body: string) {
  const cleanedPhone = phone.replace(/[^\d+]/g, "");
  const encodedBody = encodeURIComponent(body);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const smsUrl = isIOS
    ? `sms:${cleanedPhone}&body=${encodedBody}`
    : `sms:${cleanedPhone}?body=${encodedBody}`;

  window.location.href = smsUrl;
}

export default function BookingDetailActions({ item }: { item: BookingItem }) {
  const handleSmsClick = async () => {
    const phone = item.phone?.trim();

    if (!phone) {
      alert("연락처가 없습니다.");
      return;
    }

    const smsBody = buildSmsBody();
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      openSmsApp(phone, smsBody);
      return;
    }

    const copied = await copyTextWithFallback(smsBody);

    if (copied) {
      alert("데스크톱에서는 문자 앱이 자동으로 열리지 않을 수 있어 문자 내용을 복사했습니다.");
    } else {
      alert("데스크톱에서는 문자 앱 자동 실행이 어려울 수 있습니다.");
    }
  };

  const handleCalendarClick = () => {
    const calendarUrl = buildGoogleCalendarUrl(item);

    if (!calendarUrl) {
      alert("날짜 정보가 없어 구글 캘린더를 열 수 없습니다.");
      return;
    }

    window.open(calendarUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleSmsClick}
        className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:opacity-90"
      >
        문자 보내기
      </button>

      <button
        type="button"
        onClick={handleCalendarClick}
        className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
      >
        구글 캘린더 추가
      </button>
    </div>
  );
}