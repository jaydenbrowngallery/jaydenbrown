import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";
import RequestBoard from "./RequestBoard";
import FlowSections from "./FlowSections";
import { STEPS } from "./flowData";

export const dynamic = "force-dynamic";
export const metadata = { title: "시스템 정리", robots: { index: false, follow: false } };

export default async function SystemPage() {
  const { user } = await requireAdmin();
  if (!isAdmin(user?.email)) redirect("/login");

  const autoCount = STEPS.reduce(
    (n, s) => n + s.items.filter((i) => i.actor === "자동" || i.actor === "감시").length,
    0
  );
  const manualCount = STEPS.reduce((n, s) => n + s.items.filter((i) => i.actor === "수동").length, 0);

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-3xl">
        {/* 머리말 */}
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/30">System</p>
        <h1 className="mt-3 text-[1.5rem] font-medium tracking-[-0.02em] text-black/80 md:text-[1.9rem]">
          작업 흐름과 자동화 현황
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.9] text-black/45 md:text-[14.5px]">
          신청서가 들어오고 앨범이 출고되기까지 12단계입니다.
          <br />
          어느 단계가 자동으로 돌아가고, 어디를 직접 눌러야 하는지 정리했습니다.
        </p>

        <div className="mt-6 flex flex-wrap gap-2 text-[12.5px]">
          <span className="rounded-full bg-[#0f7a37] px-3 py-1 text-white">자동 {autoCount}</span>
          <span className="rounded-full bg-black/[0.07] px-3 py-1 text-black/55">수동 {manualCount}</span>
          <span className="rounded-full bg-black/[0.04] px-3 py-1 text-black/45">단계 {STEPS.length}</span>
        </div>

        {/* ── 요청 보드 ── */}
        <section className="mt-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[1.05rem] font-medium text-black/75">요청 보드</h2>
            <p className="text-[12px] text-black/35">적어두시면 제가 읽고 처리합니다</p>
          </div>
          <p className="mt-2 mb-4 text-[13px] leading-[1.85] text-black/45">
            생각날 때 여기에 적어두세요. 다음 대화에서 제가 이 목록을 확인하고,
            처리하면서 상태와 메모를 남깁니다.
          </p>
          <RequestBoard />
        </section>

        <FlowSections />

        <p className="mt-16 text-center text-[11px] uppercase tracking-[0.28em] text-black/20">
          © Jayden Brown
        </p>
      </div>
    </main>
  );
}
