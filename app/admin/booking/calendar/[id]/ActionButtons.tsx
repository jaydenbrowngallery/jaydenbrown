"use client";
import { useState } from "react";

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
  bookingId?: string | null;
};

export default function ActionButtons({ email, phone, name, date, time, location, address, address_detail, depositor_name, product, message, title, bookingId }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCopyEmail = async () => {
    if (!email || email === "-") { alert("복사할 이메일이 없습니다."); return; }
    try { await navigator.clipboard.writeText(email); alert("이메일을 복사했습니다."); }
    catch { alert("이메일 복사에 실패했습니다."); }
  };

  const handleConfirm = async () => {
    if (!phone || phone === "-") { alert("연락처가 없습니다."); return; }
    if (!date) { alert("행사 날짜가 없습니다."); return; }
    if (!confirm(`${name || "고객"}님께 예약 접수 문자를 발송하시겠습니까?`)) return;
    setSending(true);
    try {
      const res = await fetch("/api/confirm-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name, date, time, location, depositor_name, title, email, address, address_detail, product, message }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
      alert("✅ 예약 접수 문자 발송 완료!");
    } catch {
      alert("❌ 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  const smsMessage = `안녕하세요? 제이든브라운 입니다. 행사 날 정말 수고많으셨어요😊 1차 선별 및 영상 작업이 마무리되어 금일 메일 발송예정입니다. 촬영비 43만원 카카오뱅크 3333 09 0903931 (예금주 박이용)으로 부탁드립니다.`;
  const smsHref = phone && phone !== "-" ? `sms:${phone}?body=${encodeURIComponent(smsMessage)}` : null;

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button type="button" onClick={handleCopyEmail} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
        이메일 복사
      </button>
      <button type="button" onClick={handleConfirm} disabled={sending || sent}
        className={`inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition ${sent ? "bg-green-600" : sending ? "bg-black/50" : "bg-black hover:opacity-90"}`}>
        {sent ? "✅ 발송 완료" : sending ? "발송 중..." : "✉️ 예약 접수 문자 발송"}
      </button>
      {smsHref && (
        <a href={smsHref} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
          촬영비 입금 문자
        </a>
      )}
    </div>
  );
}
