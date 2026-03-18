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
  const smsMessage = `안녕하세요^^ 제이든브라운 입니다.
신청서 접수 되었습니다.
다음 계좌번호로 예약금 5만원 입금해주시면 됩니다.
입금 후 따로 연락은 주지 않으셔도 됩니다.^^
계좌는 신한110-343-765507 예금주 박이용입니다. 감사합니다.`;

  const bookingCopyText = [
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

  const handleCopyBooking = async () => {
    try {
      await navigator.clipboard.writeText(bookingCopyText);
      alert("신청서 내용이 복사되었습니다.");
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const handleCopySMS = async () => {
    try {
      await navigator.clipboard.writeText(smsMessage);
      alert("문자 내용이 복사되었습니다.");
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

    // 제목: 시간 / 촬영자명 / 장소
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

  const buildSmsNumberOnlyUrl = () => {
    if (!item.phone) return null;

    const normalizedPhone = item.phone.replace(/[^0-9]/g, "");
    return `sms:${normalizedPhone}`;
  };

  const handleCalendarAndSMS = async () => {
    const calendarUrl = buildGoogleCalendarUrl();
    const smsUrl = buildSmsNumberOnlyUrl();

    if (!calendarUrl) {
      alert("날짜 정보가 없어 캘린더를 열 수 없습니다.");
      return;
    }

    // 1) 캘린더 새 탭 열기
    window.open(calendarUrl, "_blank", "noopener,noreferrer");

    // 2) 문자 내용 자동 복사
    try {
      await navigator.clipboard.writeText(smsMessage);
    } catch {
      // 복사 실패해도 계속 진행
    }

    // 3) 전화번호만 들어간 sms 호출 시도
    if (smsUrl) {
      setTimeout(() => {
        window.location.href = smsUrl;
      }, 300);

      setTimeout(() => {
        alert(
          `문자 앱 호출을 시도했습니다.\n수신번호: ${item.phone || "-"}\n문자 내용은 복사되어 있으니 붙여넣기 후 보내세요.`
        );
      }, 600);

      return;
    }

    alert("전화번호가 없어 문자 앱을 열 수 없습니다.");
  };

  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button
        type="button"
        onClick={handleCopyBooking}
        className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
      >
        신청서 복사
      </button>

      <button
        type="button"
        onClick={handleCopySMS}
        className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
      >
        문자 내용 복사
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