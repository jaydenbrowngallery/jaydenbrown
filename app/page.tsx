import Link from "next/link";
import { Camera, MessageCircle, BookOpen, User } from "lucide-react";

export default function HomePage() {
  return (
    <main className="bg-[#f7f5f2] text-[#111111]">
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
          <div className="order-2 md:order-1">
            <p className="mb-4 text-[11px] uppercase tracking-[0.32em] text-black/30">
              Jayden Brown Studio
            </p>

            <h1 className="text-[2.2rem] font-semibold leading-[1.15] tracking-[-0.05em] text-black md:text-[4.8rem]">
              행복이 머문 시간은,
              <br />
              사진 속에도
              <br />
              고스란히 남습니다.
            </h1>

            <div className="mt-7 max-w-2xl space-y-4 text-[15px] leading-7 text-black/48 md:text-[18px] md:leading-8">
              <p>
                훗날 사진을 꺼내 보며 웃음 지을 수 있으려면,
                촬영하는 지금 이 순간이 온전히 행복해야 합니다.
              </p>

              <p>
                당신의 가장 자연스러운 미소를 끌어내는
                편안한 시간을 선물합니다.
              </p>
            </div>

            {/* 하단 링크: 모바일/PC 공통 표시 */}
            <div className="mt-10 grid grid-cols-4 gap-3 md:mt-12 md:max-w-xl">
              <QuickLink
                href="/portfolio"
                icon={<Camera size={20} />}
                label="작업"
              />
              <QuickLink
                href="/contact"
                icon={<MessageCircle size={20} />}
                label="문의"
              />
              <QuickLink
                href="/guide"
                icon={<BookOpen size={20} />}
                label="가이드"
              />
              <QuickLink
                href="/about"
                icon={<User size={20} />}
                label="소개"
              />
            </div>
          </div>

          <div className="order-1 md:order-2">
            <div className="overflow-hidden rounded-[30px] bg-[#ece7e1] shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <div
                className="aspect-[4/5] w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/img/001.jpg')" }}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-black/6">
        <div className="mx-auto max-w-7xl px-6 py-16 md:px-10 md:py-24">
          <div className="max-w-4xl">
            <p className="text-[11px] uppercase tracking-[0.3em] text-black/28">
              About
            </p>

            <h2 className="mt-4 text-[2rem] font-semibold leading-[1.2] tracking-[-0.04em] md:text-[3.4rem]">
              좋은 사진은
              <br />
              좋은 시간에서 시작된다고 믿습니다.
            </h2>

            <p className="mt-7 max-w-3xl text-[15px] leading-8 text-black/48 md:text-[18px]">
              과한 연출보다 자연스러운 흐름을 따라가며,
              그날의 공기와 표정, 관계의 온도를 담는 촬영을 지향합니다.
              편안한 분위기 안에서 만들어진 장면은 시간이 지나도 더 따뜻하게 남습니다.
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
      className="flex flex-col items-center justify-center rounded-[20px] border border-black/8 bg-white py-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-black/5"
    >
      <div className="mb-2 text-black">{icon}</div>
      <span className="text-xs font-medium text-black/70">{label}</span>
    </Link>
  );
}