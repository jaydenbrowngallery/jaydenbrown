"use client";

type Props = {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  address?: string | null;
  address_detail?: string | null;
  depositor_name?: string | null;
  product?: string | null;
  message?: string | null;
  title?: string | null;
};

function formatTimeSlot(slot?: string | null) {
  switch (slot) {
    case "1부": return "1부(12시)";
    case "2부": return "2부(14시30분)";
    case "3부": return "3부(16시)";
    default: return slot || "";
  }
}

export default function ActionButtons({
  email, phone, name, date, time, location,
  address, address_detail, depositor_name, product, message, title,
}: Props) {

  const handleCopyEmail = async () => {
    if (!email || email === "-") { alert("복사할 이메일이 없습니다."); return; }
    try {
      await navigator.clipboard.writeText(email);
      alert("이메일을 복사했습니다.");
    } catch {
      alert("이메일 복사에 실패했습니다.");
    }
  };

  const smsMessage = `안녕하세요? 제이든브라운 입니다.
행사 날 정말 수고많으셨어요😊
1차 선별 및 영상 작업이 마무리되어
금일 메일 발송예정입니다. 
촬영비 43만원 카카오뱅크 3333 09 0903931 (예금주 박이용)으로 부탁드립니다.`;

  const smsHref = phone && phone !== "-"
    ? `sms:${phone}?body=${encodeURIComponent(smsMessage)}`
    : null;

  // 구글 캘린더 이벤트 생성
  const handleCalendar = () => {
    if (!date) { alert("촬영 날짜가 없습니다."); return; }

    // 제목: 시간 이름 장소
    const calTitle = `${formatTimeSlot(time)} ${name || ""} ${location || ""}`.trim();

    // 내용: 전체 정보
    const details = [
      title ? `제목: ${title}` : "",
      `이름: ${name || "-"}`,
      `연락처: ${phone || "-"}`,
      `이메일: ${email || "-"}`,
      `촬영날짜: ${date || "-"}`,
      `시간: ${formatTimeSlot(time)}`,
      `장소: ${location || "-"}`,
      `주소: ${address || "-"}`,
      `상세주소: ${address_detail || "-"}`,
      `입금자명: ${depositor_name || "-"}`,
      `상품: ${product || "-"}`,
      `내용: ${message || "-"}`,
    ].filter(Boolean).join("\n");

    // 날짜 포맷 (YYYYMMDD)
    const dateStr = date.replace(/-/g, "");

    // 시간대별 시작/종료 시간
    let startTime = "120000";
    let endTime = "140000";
    if (time === "2부") { startTime = "143000"; endTime = "163000"; }
    if (time === "3부") { startTime = "180000"; endTime = "200000"; }

    const start = `${dateStr}T${startTime}`;
    const end = `${dateStr}T${endTime}`;

    const calUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calTitle)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location || "")}`;

    // 구글 캘린더 열기
    window.open(calUrl, "_blank");

    // 동시에 촬영비 문자도 실행
    if (smsHref) {
      setTimeout(() => {
        window.location.href = smsHref;
      }, 500);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleCopyEmail}
        className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
      >
        이메일 복사
      </button>

      <button
        type="button"
        onClick={handleCalendar}
        className="inline-flex h-12 items-center justify-center rounded-full bg-black px-5 text-sm font-medium text-white transition hover:opacity-90"
      >
        구글 캘린더 + 입금 문자
      </button>

      {smsHref && (
        <a
          href={smsHref}
          className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
        >
          촬영비 입금 문자
        </a>
      )}
    </div>
  );
}
