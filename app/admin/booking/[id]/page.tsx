import BookingDetailActions from "./BookingDetailActions";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { deleteBookingRequest } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

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
    case "pending":
    default:
      return "대기";
  }
}

export default async function AdminBookingDetailPage({ params }: Props) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data: item, error } = await supabase
    .from("booking_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !item) {
    notFound();
  }

  async function deleteAction(formData: FormData) {
    "use server";
    await deleteBookingRequest(formData);
    redirect("/admin/booking");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">신청서 상세</h1>
          <p className="mt-2 text-sm text-black/45">
            신청일{" "}
            {item.created_at
              ? new Date(item.created_at).toLocaleString("ko-KR")
              : "-"}
          </p>
        </div>

        <Link
          href="/admin/booking"
          className="rounded-xl border border-black/10 px-4 py-2 text-sm hover:bg-black/5"
        >
          목록으로
        </Link>
      </div>

      <div className="space-y-8 rounded-[28px] border border-black/10 bg-white p-6 md:p-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <InfoBox label="제목" value={item.title} />
          <InfoBox label="촬영자명 (돌잔치는 아기이름)" value={item.name} />
          <InfoBox label="연락처" value={item.phone} />
          <InfoBox label="이메일" value={item.email} />
          <InfoBox label="날짜" value={item.date} />
          <InfoBox label="시간" value={formatTimeSlot(item.time)} />
          <InfoBox label="촬영 장소" value={item.location} />
          <InfoBox label="입금자명" value={item.depositor_name} />
          <InfoBox label="상품 선택" value={item.product} />
          <InfoBox label="상태" value={formatStatus(item.status)} />
        </div>

        <div className="space-y-5">
          <FullBox label="주소" value={item.address} />
          <FullBox label="상세주소" value={item.address_detail} />
          <MessageBox label="문의 내용" value={item.message} />
        </div>

        <div className="border-t border-black/10 pt-6">
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-center gap-3">
      <BookingDetailActions item={item} />

      <Link
        href={`/admin/booking/${item.id}/edit`}
        className="rounded-xl border border-black/10 px-5 py-3 text-sm hover:bg-black/5"
      >
        수정하기
      </Link>
    </div>

    <form action={deleteAction}>
      <input type="hidden" name="id" value={item.id} />
      <button
        type="submit"
        className="rounded-xl bg-red-600 px-5 py-3 text-sm text-white hover:bg-red-700"
      >
        삭제하기
      </button>
    </form>
  </div>
</div>
      </div>
    </main>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 py-5">
      <p className="mb-2 text-sm text-black/40">{label}</p>
      <p className="text-base font-medium text-black">{value || "-"}</p>
    </div>
  );
}

function FullBox({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 py-5">
      <p className="mb-2 text-sm text-black/40">{label}</p>
      <p className="break-all text-base font-medium text-black">
        {value || "-"}
      </p>
    </div>
  );
}

function MessageBox({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-[22px] border border-black/10 bg-[#f7f5f2] px-6 py-5">
      <p className="mb-2 text-sm text-black/40">{label}</p>
      <div className="min-h-[180px] whitespace-pre-wrap text-base font-medium text-black">
        {value || "-"}
      </div>
    </div>
  );
}