"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  status?: string | null;
  googleEventId?: string | null;
};

export default function ActionButtons({ email, phone, name, date, time, location, address, address_detail, depositor_name, product, message, title, bookingId, status, googleEventId }: Props) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

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
        body: JSON.stringify({ bookingId, phone, name, date, time, location, depositor_name, title, email, address, address_detail, product, message }),
      });
      if (!res.ok) throw new Error("failed");
      setSent(true);
      alert("✅ 예약 접수 문자 발송 완료!");
      router.refresh();
    } catch {
      alert("❌ 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSending(false);
    }
  };

  const handleEdit = () => {
    if (!bookingId) return;
    router.push(`/admin/booking/calendar/${bookingId}/edit`);
  };

  const handleDelete = async () => {
    if (!bookingId) return;
    if (!confirm(`정말 "${name || "이 예약"}" 예약을 삭제하시겠습니까?\n삭제하면 구글 캘린더 일정도 함께 삭제됩니다.`)) return;

    setDeleting(true);
    try {
      // 1. 구글 캘린더 이벤트 삭제 (있는 경우)
      if (googleEventId) {
        try {
          await fetch("/api/calendar-delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventId: googleEventId, bookingId }),
          });
        } catch (calErr) {
          console.error("캘린더 삭제 실패:", calErr);
        }
      }

      // 2. Supabase 예약 삭제
      const res = await fetch("/api/booking-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) throw new Error("삭제 실패");

      alert("✅ 예약이 삭제되었습니다.");
      router.push("/admin/booking");
      router.refresh();
    } catch {
      alert("❌ 삭제 중 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const smsMessage = `안녕하세요? 제이든브라운 입니다. 행사 날 정말 수고많으셨어요😊 1차 선별 및 영상 작업이 마무리되어 금일 메일 발송예정입니다. 촬영비 43만원 카카오뱅크 3333 09 0903931 (예금주 박이용)으로 부탁드립니다.`;
  const smsHref = phone && phone !== "-" ? `sms:${phone}?body=${encodeURIComponent(smsMessage)}` : null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {/* 주요 액션 버튼들 */}
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={handleCopyEmail} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
          이메일 복사
        </button>
        {status !== "confirmed" && (
          <button type="button" onClick={handleConfirm} disabled={sending || sent}
            className={`inline-flex h-12 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition ${sent ? "bg-green-600" : sending ? "bg-black/50" : "bg-black hover:opacity-90"}`}>
            {sent ? "✅ 발송 완료" : sending ? "발송 중..." : "✉️ 예약 접수 문자 발송"}
          </button>
        )}
        {smsHref && (
          <a href={smsHref} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
            촬영비 입금 문자
          </a>
        )}
      </div>

      {/* 수정 / 삭제 버튼 */}
      <div className="flex flex-wrap gap-3 border-t border-black/10 pt-4">
        <button type="button" onClick={handleEdit}
          className="inline-flex h-10 items-center justify-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
          ✏️ 수정
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting}
          className={`inline-flex h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-white transition ${deleting ? "bg-red-300" : "bg-red-500 hover:bg-red-600"}`}>
          {deleting ? "삭제 중..." : "🗑️ 삭제"}
        </button>
      </div>
    </div>
  );
}
