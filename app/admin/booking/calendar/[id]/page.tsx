import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import ActionButtons from "../calendar/[id]/ActionButtons";

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
};

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
    case "cancelled": return "취소";
    default: return "대기";
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-700";
    case "cancelled": return "bg-red-100 text-red-700";
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

  const { data: booking, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !booking) {
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
        />
      </div>
    </main>
  );
}
