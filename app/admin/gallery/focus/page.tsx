import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/isAdmin";
import FocusEditor from "./FocusEditor";
import StoryMeta from "./StoryMeta";

export const dynamic = "force-dynamic";
export const metadata = { title: "사진 구도 조정", robots: { index: false, follow: false } };

export default async function GalleryFocusPage() {
  const { user } = await requireAdmin();
  if (!isAdmin(user?.email)) redirect("/login");

  return (
    <main className="min-h-screen bg-[#f7f5f2] px-5 py-10 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-black/30">Gallery</p>
        <h1 className="mt-3 text-[1.4rem] font-medium tracking-[-0.02em] text-black/80 md:text-[1.8rem]">
          사진 구도 조정
        </h1>
        <p className="mt-3 text-[13.5px] leading-[1.9] text-black/45">
          갤러리에서 사진이 잘리는 위치를 직접 정합니다.
          <br />
          기본은 인물 자동 검출이고, 여기서 저장한 사진은 지정한 구도로 고정됩니다.
        </p>
        <div className="mt-5 flex gap-2">
          <Link
            href="/portfolio-manage"
            className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-black/60 transition hover:border-black/30"
          >
            갤러리 관리 · 삭제
          </Link>
          <Link
            href="/portfolio"
            className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-black/60 transition hover:border-black/30"
          >
            갤러리 보기
          </Link>
          <Link
            href="/admin/system"
            className="rounded-full border border-black/12 bg-white px-4 py-2 text-[13px] text-black/60 transition hover:border-black/30"
          >
            시스템 정리
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="text-[1.05rem] font-medium text-black/75">스토리 설정 — 계절 · 멘트</h2>
          <div className="mt-4">
            <StoryMeta />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-[1.05rem] font-medium text-black/75">사진별 구도</h2>
          <div className="mt-4">
            <FocusEditor />
          </div>
        </section>
      </div>
    </main>
  );
}
