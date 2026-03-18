"use client";

type Props = {
  item: {
    id: string;
    title?: string | null;
    name?: string | null;
    phone?: string | null;
    email?: string | null;
    date?: string | null;
    time?: string | null;
    location?: string | null;
    zipcode?: string | null;
    address?: string | null;
    address_detail?: string | null;
    depositor_name?: string | null;
    product?: string | null;
    message?: string | null;
    status?: string | null;
  };
};

export default function BookingDetailActions({ item }: Props) {
  const copyText = [
    `[예약 신청서]`,
    `제목: ${item.title || "-"}`,
    `촬영자명: ${item.name || "-"}`,
    `연락처: ${item.phone || "-"}`,
    `이메일: ${item.email || "-"}`,
    `날짜: ${item.date || "-"}`,
    `시간: ${item.time || "-"}`,
    `장소: ${item.location || "-"}`,
    `우편번호: ${item.zipcode || "-"}`,
    `주소: ${item.address || "-"}`,
    `상세주소: ${item.address_detail || "-"}`,
    `입금자명: ${item.depositor_name || "-"}`,
    `상품: ${item.product || "-"}`,
    `상태: ${item.status || "pending"}`,
    `문의 내용: ${item.message || "-"}`,
  ].join("\n");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
      alert("신청 내용이 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const buildGoogleCalendarUrl = () => {
    if (!item.date) return null;

    const start = new Date(item.date);
    if (Number.isNaN(start.getTime())) return null;

    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}${m}${day}`;
    };

    const startDate = formatDate(start);
    const endDate = formatDate(end);

    // 제목: 시간 / 이름 / 장소
    const calendarTitle = [item.time, item.name, item.location]
      .filter(Boolean)
      .join(" / ");

    const details = [
      `[예약 신청서]`,
      `제목: ${item.title || "-"}`,
      `촬영자명: ${item.name || "-"}`,
      `연락처: ${item.phone || "-"}`,
      `이메일: ${item.email || "-"}`,
      `날짜: ${item.date || "-"}`,
      `시간: ${item.time || "-"}`,
      `장소: ${item.location || "-"}`,
      `우편번호: ${item.zipcode || "-"}`,
      `주소: ${item.address || "-"}`,
      `상세주소: ${item.address_detail || "-"}`,
      `입금자명: ${item.depositor_name || "-"}`,
      `상품: ${item.product || "-"}`,
      `상태: ${item.status || "pending"}`,
      `문의 내용: ${item.message || "-"}`,
    ].join("\n");

    const location = [item.location, item.address, item.address_detail]
      .filter(Boolean)
      .join(" / ");

    return (
      "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      `&text=${encodeURIComponent(calendarTitle || "예약 일정")}` +
      `&dates=${startDate}/${endDate}` +
      `&details=${encodeURIComponent(details)}` +
      `&location=${encodeURIComponent(location)}`
    );
  };

  const buildSmsUrl = () => {
    if (!item.phone) return null;

    const message = `안녕하세요^^ 제이든브라운 입니다.
신청서 접수 되었습니다.
다음 계좌번호로 예약금 5만원 입금해주시면 됩니다.
입금 후 따로 연락은 주지 않으셔도 됩니다.^^
계좌는 신한110-343-765507 예금주 박이용입니다. 감사합니다.`;

    return `sms:${item.phone}?body=${encodeURIComponent(message)}`;
  };

  const handleCalendarAndSMS = () => {
    const calendarUrl = buildGoogleCalendarUrl();
    const smsUrl = buildSmsUrl();

    if (!calendarUrl) {
      alert("날짜 정보가 없어 캘린더를 열 수 없습니다.");
      return;
    }

    if (!smsUrl) {
      alert("전화번호가 없어 문자를 열 수 없습니다.");
      return;
    }

    // 1) 캘린더는 새 탭으로
    window.open(calendarUrl, "_blank", "noopener,noreferrer");

    // 2) 현재 탭은 문자 앱으로 이동
    window.location.href = smsUrl;
  };

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        onClick={handleCopy}
        className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
      >
        내용 복사하기
      </button>

      <button
        type="button"
        onClick={handleCalendarAndSMS}
        className="rounded-xl bg-black px-5 py-3 text-sm text-white hover:opacity-90"
      >
        캘린더로 보내기
      </button>
    </div>
  );
}