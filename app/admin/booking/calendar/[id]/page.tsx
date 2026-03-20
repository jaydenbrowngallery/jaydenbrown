import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin";
import ActionButtons from "./ActionButtons";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CalendarEvent = {
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
  start_at?: string | null;
  end_at?: string | null;
  description?: string | null;
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

export default async function CalendarDetailPage({ params }: PageProps) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: event, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !event) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <div className="rounded-[28px] bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">일정 상세</h1>
          <p className="mt-4 text-red-500">일정 정보를 불러오지 못했습니다.</p>
          <Link href="/admin/booking" className="mt-6 inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
            목록으로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const item = event as CalendarEvent;
  const email = item.email || "-";
  const phone = item.phone || "-";

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-8">
      <div className="rounded-[28px] bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {item.title || "일정 상세"}
          </h1>
          <Link href="/admin/booking" className="inline-flex h-11 items-center rounded-full border border-black/10 bg-white px-5 text-sm font-medium text-black transition hover:bg-black/5">
            목록으로
          </Link>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-black/10">
          <div className="grid grid-cols-1 divide-y divide-black/10">
            <Row label="제목" value={item.title} />
            <Row label="시작" value={formatDateTime(item.start_at)} />
            <Row label="종료" value={formatDateTime(item.end_at)} />
            <Row label="장소" value={item.location} />
            <Row label="내용" value={item.description || item.message || item.content} multiline />
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
          message={item.description || item.message || item.content}
          title={item.title}
        />
      </div>
    </main>
  );
}
