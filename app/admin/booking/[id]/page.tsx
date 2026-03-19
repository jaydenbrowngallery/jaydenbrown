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

function formatStatus(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "확정";
    case "cancelled":
      return "취소";
    default:
      return "대기";
  }
}

function getStatusBadgeClass(status?: string | null) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
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
          <Link
            href="/admin/booking"
            className="mt-6 inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
          >
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
            <p
              className={`mb-2 inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(
                item.status
              )}`}
            >
              {formatStatus(item.status)}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {item.title || item.name || "예약 상세"}
            </h1>
          </div>

          <Link
            href="/admin/booking"
            className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5"
          >
            목록으로
          </Link>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/10">
          <div className="grid grid-cols-1 divide-y divide-black/10">
            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">신청일</div>
              <div className="text-sm text-black">
                {formatDateTime(item.created_at)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">제목</div>
              <div className="text-sm text-black">{item.title || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">이름</div>
              <div className="text-sm text-black">{item.name || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">연락처</div>
              <div className="text-sm text-black">{item.phone || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">이메일</div>
              <div className="text-sm text-black">{item.email || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">촬영날짜</div>
              <div className="text-sm text-black">{item.date || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">시간</div>
              <div className="text-sm text-black">
                {formatTimeSlot(item.time)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">장소</div>
              <div className="text-sm text-black">{item.location || "-"}</div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">상태</div>
              <div className="text-sm text-black">
                {formatStatus(item.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 p-5 md:grid-cols-[120px_1fr]">
              <div className="text-sm font-semibold text-black/55">내용</div>
              <div className="whitespace-pre-wrap break-words text-sm text-black">
                {item.content || "-"}
              </div>
            </div>
          </div>
        </div>

        <ActionButtons email={email} phone={phone} />
      </div>
    </main>
  );
}