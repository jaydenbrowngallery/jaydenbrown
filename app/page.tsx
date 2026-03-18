import Link from "next/link";
import { Camera, MessageCircle, BookOpen, User } from "lucide-react";

export default function HomePage() {
  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      {/* ================= 모바일 ================= */}
      <section className="block min-h-screen px-6 py-10 md:hidden">
        {/* 로고 */}
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold tracking-[0.28em]">
            JAYDEN BROWN
          </p>
        </div>

        {/* 메인 카피 */}
        <div className="text-center">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-[-0.04em]">
            촬영하는 시간이
            <br />
            행복해야
            <br />
            기억도 오래 남습니다.
          </h1>

          <p className="mt-5 text-sm leading-6 text-black/50">
            사진보다 먼저 기억에 남는 것은
            그날의 시간이라고 생각합니다.
          </p>
        </div>

        {/* 이미지 */}
        <div className="mt-10 overflow-hidden rounded-[26px]">
          <div
            className="aspect-[4/5] w-full bg-cover bg-center"
            style={{ backgroundImage: "url('/img/001.jpg')" }}
          />
        </div>

        {/* 하단 아이콘 메뉴 */}
        <div className="mt-10 grid grid-cols-4 gap-3">
          <QuickLink href="/portfolio" icon={<Camera size={20} />} label="작업" />
          <QuickLink href="/contact" icon={<MessageCircle size={20} />} label="문의" />
          <QuickLink href="/guide" icon={<BookOpen size={20} />} label="가이드" />
          <QuickLink href="/about" icon={<User size={20} />} label="소개" />
        </div>
      </section>

      {/* ================= 데스크탑 ================= */}
      <section className="hidden md:block">
        <div className="mx-auto max-w-7xl px-10 py-20">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div>
              <h1 className="text-6xl font-semibold leading-[1.05] tracking-[-0.04em]">
                촬영하는 시간이
                <br />
                행복해야
                <br />
                기억도 오래 남습니다.
              </h1>

              <p className="mt-6 text-lg text-black/50">
                편안한 흐름 속에서 자연스럽게 기록합니다.
              </p>
            </div>

            <div className="overflow-hidden rounded-[32px]">
              <div
                className="aspect-[4/5] w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/img/001.jpg')" }}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function QuickLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center rounded-[20px] bg-white py-5 shadow-sm transition hover:-translate-y-0.5"
    >
      <div className="mb-2 text-black">{icon}</div>
      <span className="text-xs text-black/70">{label}</span>
    </Link>
  );
}