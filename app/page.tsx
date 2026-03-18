import Link from "next/link";
import { Camera, MessageCircle, BookOpen, CalendarDays } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f5f2] text-[#111111]">
      <section className="mx-auto flex max-w-6xl flex-col px-6 pb-10 pt-8 md:px-10 md:pt-12">
        {/* 로고 영역 */}
        <div className="mb-8 flex justify-center md:mb-10 md:justify-start">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-black">
            Jayden Brown
          </p>
        </div>

        {/* 메인 비주얼 */}
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="order-2 md:order-1">
            <h1 className="text-center text-4xl font-semibold leading-[1.08] tracking-[-0.05em] md:text-left md:text-7xl">
              촬영하는 시간이
              <br />
              행복해야
              <br />
              기억도 오래 남습니다.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-center text-base leading-7 text-black/50 md:mx-0 md:text-left md:text-lg">
              사진보다 먼저 기억에 남는 것은 그날의 시간이라고 생각합니다.
              편안하고 자연스러운 흐름 안에서, 오래 남는 사진을 기록합니다.
            </p>
          </div>

          <div className="order-1 overflow-hidden rounded-[28px] bg-[#e9e5df] md:order-2">
            <div
              className="aspect-[4/5] w-full bg-cover bg-center"
              style={{ backgroundImage: "url('/img/001.jpg')" }}
            />
          </div>
        </div>

        {/* 하단 아이콘 메뉴 */}
        <div className="mt-10 grid grid-cols-4 gap-3 md:mt-14 md:max-w-xl">
          <QuickLink
            href="/portfolio"
            icon={<Camera className="h-5 w-5" />}
            label="갤러리"
          />
          <QuickLink
            href="/contact"
            icon={<MessageCircle className="h-5 w-5" />}
            label="문의"
          />
          <QuickLink
            href="/guide"
            icon={<BookOpen className="h-5 w-5" />}
            label="가이드"
          />
          <QuickLink
            href="/about"
            icon={<CalendarDays className="h-5 w-5" />}
            label="소개"
          />
        </div>
      </section>

      {/* 하단 짧은 소개 */}
      <section className="border-t border-black/5">
        <div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-black/30">
              About
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-5xl">
              좋은 사진은
              <br />
              좋은 시간에서 시작된다고 믿습니다.
            </h2>
            <p className="mt-6 text-base leading-8 text-black/50 md:text-lg">
              과한 연출보다는 자연스러운 흐름을 따라가며, 그날의 공기와 표정,
              관계의 온도를 담는 촬영을 지향합니다.
            </p>
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
      className="flex flex-col items-center justify-center rounded-[22px] border border-black/8 bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-0.5 hover:bg-black/5"
    >
      <div className="mb-2 text-black">{icon}</div>
      <span className="text-sm font-medium text-black/70">{label}</span>
    </Link>
  );
}