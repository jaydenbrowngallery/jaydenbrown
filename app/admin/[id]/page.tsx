import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { deleteBookingRequest } from "../actions";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">신청서 상세</h1>
        <Link
          href="/admin/booking"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          목록으로
        </Link>
      </div>

      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-sm text-gray-500">이름</p>
            <p className="font-medium">{item.name ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">연락처</p>
            <p className="font-medium">{item.phone ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">제목</p>
            <p className="font-medium">{item.title ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">날짜</p>
            <p className="font-medium">{item.date ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">시간</p>
            <p className="font-medium">{item.time ?? "-"}</p>
          </div>

          <div>
            <p className="mb-1 text-sm text-gray-500">장소</p>
            <p className="font-medium">{item.location ?? "-"}</p>
          </div>
        </div>

        <div>
          <p className="mb-1 text-sm text-gray-500">신청일</p>
          <p className="font-medium">
            {item.created_at
              ? new Date(item.created_at).toLocaleString("ko-KR")
              : "-"}
          </p>
        </div>

        <div className="border-t pt-6">
          <form action={deleteAction}>
            <input type="hidden" name="id" value={item.id} />
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              삭제
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}