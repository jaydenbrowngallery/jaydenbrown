"use client";

import { useMemo, useState } from "react";

type BookingItem = {
  id: string;
  name?: string | null;
  phone?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
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

function buildSmsMessage(item: BookingItem) {
  return [
    `${item.name || "고객"}님, 예약 안내드립니다.`,
    "",
    `촬영 날짜: ${item.date || "-"}`,
    `촬영 시간: ${formatTimeSlot(item.time)}`,
    `촬영 장소: ${item.location || "-"}`,
    "",
    `문의사항 있으시면 편하게 연락 부탁드립니다.`,
    `감사합니다.`,
  ].join("\n");
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

  // 한국 시간 기준으로 생성 후 UTC 문자열로 변환
  const startLocal = new Date(year, month - 1, day, range.startHour, range.startMinute);
  const endLocal = new Date(year, month - 1, day, range.endHour, range.endMinute);

  const title = `${item.name || "고객"} 촬영`;
  const details = [
    `이름: ${item.name || "-"}`,
    `연락처: ${item.phone || "-"}`,
    `시간: ${formatTimeSlot(item.time)}`,
    `장소: ${item.location || "-"}`,
  ].join("\n");

  const location = item.location || "";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${toGoogleCalendarDate(startLocal)}/${toGoogleCalendarDate(endLocal)}`,
    details,
    location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function BookingDetailActions({ item }: { item: BookingItem }) {
  const [showSmsBox, setShowSmsBox] = useState(false);

  const smsMessage = useMemo(() => buildSmsMessage(item), [item]);
  const googleCalendarUrl = useMemo(() => buildGoogleCalendarUrl(item), [item]);

  const handleCopySms = async () => {
    const copied = await copyTextWithFallback(smsMessage);

    if (copied) {
      alert("문자 내용이 복사되었습니다.");
    } else {
      alert("복사에 실패했습니다. 아래 문자 내용 박스에서 직접 복사해 주세요.");
      setShowSmsBox(true);
    }
  };

  const handleOpenSms = () => {
    const phone = item.phone?.replace(/[^\d+]/g, "") || "";
    if (!phone) {
      alert("연락처가 없습니다.");
      return;
    }

    const encodedBody = encodeURIComponent(smsMessage);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS
      ? `sms:${phone}&body=${encodedBody}`
      : `sms:${phone}?body=${encodedBody}`;

    window.location.href = smsUrl;
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowSmsBox((prev) => !prev)}
          className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:opacity-90"
        >
          문자 내용 보기
        </button>

        <button
          type="button"
          onClick={handleCopySms}
          className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
        >
          문자 내용 복사
        </button>

        <button
          type="button"
          onClick={handleOpenSms}
          className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
        >
          문자 앱 열기
        </button>

        <a
          href={googleCalendarUrl || "#"}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => {
            if (!googleCalendarUrl) {
              e.preventDefault();
              alert("날짜 정보가 없어 캘린더를 열 수 없습니다.");
            }
          }}
          className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
        >
          구글 캘린더 추가
        </a>
      </div>

      {showSmsBox && (
        <div className="rounded-[22px] border border-black/10 bg-[#f7f5f2] p-5">
          <p className="mb-3 text-sm text-black/45">문자 내용</p>
          <textarea
            readOnly
            value={smsMessage}
            className="min-h-[180px] w-full rounded-xl border border-black/10 bg-white p-4 text-sm outline-none"
          />
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={handleCopySms}
              className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:opacity-90"
            >
              다시 복사
            </button>
          </div>
        </div>
      )}
    </div>
  );
}