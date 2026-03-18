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

            <div className="mt-7 max-w-2xl space-y-4 text-[15px] leading-7 text-black/45 md:text-[18px] md:leading-8">
  <p>
    훗날 사진을 꺼내 보며 웃음 지을 수 있으려면,
    <br />
    촬영하는 지금 이 순간이 온전히 행복해야 합니다.
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